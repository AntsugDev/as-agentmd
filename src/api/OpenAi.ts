import {ApiAbstract} from "./ApiAbstract.js";
import {callbackApi, Params} from "../utility/api.js";
import {AxiosHeaders} from "axios";
import {RawGeminiModel} from "../interface/myInterface.js";
import dayjs from "dayjs";

export class OpenAi extends ApiAbstract {


    constructor(files:any|null) {
        super('openai', 'https://api.openai.com/v1/models', 'https://api.openai.com/v1/chat/completions',files);
    }

    // @ts-ignore
    async uri_file(): Promise<any|null> {
        try{

            return null;
        }catch (err:any){
            return null;
        }
    }

// @ts-ignore
    async chat(text: any[]): string | object | null {
        try {
            const key = this.extraApiKey()
            const model = this.getModelSelect()
            const headers: AxiosHeaders = new AxiosHeaders();
            headers.set('Authorization', `Bearer ${key}`)
            headers.set('Content-Type', `application/json`)
            const response = await callbackApi({
                url: this.endPointChat,
                method: 'POST',
                headers: headers,
                payload: {
                    model: model,
                    messages: text
                }
            } as Params)

            const usage = response.data.usage
            if (usage) {
                const input = usage.prompt_tokens;
                const output = usage.completion_tokens;
                console.log(`---Utilizzo dei token-----`)
                console.log(`Input(user): ${input}`)
                console.log(`Output(Agent): ${output}`)
                console.log('--------------------------------------------')
                this.token = {
                    input:input, output: output
                }
            }

            if (response && response?.data && response?.data?.choices)
                return response.data.choices[0]?.message?.content?.toString() ?? "Errore di sistema";
            return null;

        } catch (err: any) {
            console.error(err.toString())
            return null;
        }
    }

    async sincro(): Promise<boolean> {
        try {
            this.preProviderInstance();
            const key = this.extraApiKey()
            const headers: AxiosHeaders = new AxiosHeaders();
            headers.set('Authorization', `Bearer ${key}`)
            headers.set('Content-Type', `application/json`)
            const response = await callbackApi({
                url: this.endPointModels,
                method: 'GET',
                headers: headers
            } as Params)
            let $models: RawGeminiModel[] = []
            if (response && response?.data) {
                response.data.data.map((e: any) => {
                    const name = e.id
                    const displayName = e.id
                    const description = null
                    const limitIn = null
                    const limitOut = null
                    const v = dayjs(e.created).format('YYYY-MM-DD HH:MI:SS')
                    $models.push({
                        name: name,
                        displayName: displayName,
                        description: description,
                        inputTokenLimit: limitIn,
                        outputTokenLimit: limitOut,
                        version: v
                    })
                })
            }
            if ($models.length > 0) {
                this.setModels($models)
                console.log("OpenAi models update")
                return true;
            } else {
                console.log("OpenAi models not found or exception system")
                return false;
            }

        } catch (err: any) {
            console.error(`Api extract model openai error: ${err.toString()}`)
            return false;
        }
    }

}