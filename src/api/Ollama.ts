import {callbackApi} from "../utility/api.js";
import {AgentConfig, ChatText, RawGeminiModel} from "../interface/myInterface.js";
import {ApiAbstract} from "./ApiAbstract.js";
import ollama, {Message} from "ollama";
import {configStore} from "../config.js";
import Conf from "conf";


export class Ollama extends ApiAbstract {

    private config: Conf<AgentConfig>;

    constructor() {
        super('ollama', "http://localhost:11434", null);
        this.config = configStore
    }

    // @ts-ignore
    async chat(text: any[]): Message | ChatText | null {
        try {
            let model = null;
            const modelData = this.config.get('modelSelected');
            if (!modelData) {
                console.error("Model not selected")
                return null;
            }else {
                model = modelData.toString().split('|')[1]
            }

            if(!model){
                console.error("Impossibile estrarre il modello da utilizzare")
                return null;
            }
            let response = await ollama.chat({
                model: model,
                messages: text,
                stream: false,
                options: {
                    temperature: 0.5,
                },
            });

            if (response && response.message)
                return response.message;
            return null;

        } catch (err: any) {
            console.error(`chat sync runnig error ${err.toString()}`)
            return null;
        }
    }

    OllamaRun = async (): Promise<boolean | undefined> => {
        try {
            if (this.endPointChat === null) return false;
            const response = await callbackApi({
                url: this.endPointChat.toString(),
                method: 'GET'
            })
            if (response && parseInt(response.status) === 200)
                return true;

            return false;

        } catch (err: any) {
            console.log(`Ollama check runnig error ${err.toString()}`)
        }
    }

// @ts-ignore
    async sincro(): boolean {
        try {
            // @ts-ignore
            this.preProviderInstance()
            if (await this.OllamaRun()) {
                // @ts-ignore
                const response = await ollama.list()
                if (response?.models) {
                    this.clearModels()
                    const $models: RawGeminiModel[] = [];
                    response.models.map((e: any) => {
                        const name = e.name
                        const displayName = e.model
                        const description = null
                        const limitIn = null
                        const limitOut = null
                        const v = e.modified_at
                        $models.push({
                            name: name,
                            displayName: displayName,
                            description: description,
                            inputTokenLimit: limitIn,
                            outputTokenLimit: limitOut,
                            version: v
                        })
                    })
                    if ($models.length > 0) {
                        this.setModels($models)
                        console.log("Ollama models update")
                        return true;
                    } else {
                        console.log("Ollama models not found or exception system")
                        return false;
                    }
                }
            } else {
                console.warn("Ollama or is not installed or not running")
                return false;
            }

        } catch (err: any) {
            console.log(`Ollama sync runnig error ${err.toString()}`)
            return false;
        }
    }

}

