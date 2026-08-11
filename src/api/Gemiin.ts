import {callbackApi, Params} from "../utility/api.js";
import {ChatText, RawGeminiModel} from "../interface/myInterface.js"
import {ApiAbstract} from "./ApiAbstract.js";
import {Message} from "ollama";

const endpointStream = `https://generativelanguage.googleapis.com/v1beta/models/@model:streamGenerateContent?alt=sse&key=`;
const endpointModel = `https://generativelanguage.googleapis.com/v1beta/models?key=`

export class Gemini extends ApiAbstract {

    constructor() {
        super('gemini', endpointStream, endpointModel);
    }

    // @ts-ignore
    async chat(text: ChatText[] | Message[]): Message | ChatText | null {
        return null;
    }



    async sincro(): Promise<boolean> {
        try {
            this.preProviderInstance()
            const key = this.extraApiKey()
            const url = `${this.endPointModels}${key}`
            const r = await callbackApi({
                url: url,
                method: 'GET'
            } as Params)
            let $models: RawGeminiModel[] = []
            if (r && r?.data?.models) {
                this.clearModels()
                r.data.models.map((e: any) => {
                    const name = e.name
                    const displayName = e.displayName
                    const description = e.description
                    const limitIn = e.inputTokenLimit
                    const limitOut = e.outputTokenLimit
                    const v = e.version
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
                console.log("Gemini models update")
                return true;
            } else {
                console.log("Gemini models not found or exception system")
                return false;
            }
        } catch (err: any) {
            throw new Error(`Api extract model gemini error: ${err.toString()}`)
            return false;
        }

    }

}
