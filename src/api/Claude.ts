import {ApiAbstract} from "./ApiAbstract.js";
import {AxiosHeaders} from "axios";
import {callbackApi, Params} from "../utility/api.js";
import {RawGeminiModel} from "../interface/myInterface.js";
import dayjs from "dayjs";
import {instruction} from "../utility/utility.js";

export class Claude extends ApiAbstract {

    constructor(files:any|null) {
        super('claude', 'https://api.anthropic.com/v1/models', 'https://api.anthropic.com/v1/messages',files);
    }
// @ts-ignore
    async uri_file(): Promise<any|null>{
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
            headers.set('x-api-key', key)
            headers.set('anthropic-version', '2023-06-01')
            headers.set('content-type', 'application/json')
            const response = await callbackApi({
                url: this.endPointChat,
                method: 'POST',
                headers: headers,
                payload: {
                    "model": model,
                    "max_tokens": 1024,
                    "system": instruction,
                    "messages": text
                }
            } as Params)

            if (response) {
                if (response?.stop_reason && response.stop_reason === "max_tokens") {
                    console.warn("Risposta troncata! Aumenta max_tokens o gestisci il continue.");
                }
                const usage = response.usage
                if (usage) {
                    const input = usage.input_tokens;
                    const output = usage.output_tokens;
                    console.log(`---Utilizzo dei token-----`)
                    console.log(`Input(user): ${input}`)
                    console.log(`Output(Agent): ${output}`)
                    console.log('--------------------------------------------')
                    this.token = {
                        input:input, output: output
                    }
                }
                let t = ""
                if (response?.content) {
                    const t = response.content
                        .filter((e: any) => e.type === 'text')
                        .map((ei: { type: string; text: string }) => ei.text)
                        .join(' ');
                } else t = "Error"

                return t;
            }
            return null;

        } catch (err: any) {
          throw err;
        }
    }

    // @ts-ignore
    async sincro(): Promise<boolean> | boolean {
        try {
            this.preProviderInstance()
            const key = this.extraApiKey()
            const headers = new AxiosHeaders()
            headers.set('x-api-key', key)
            headers.set('anthropic-version', '2023-06-01')
            const response = await callbackApi({
                url: this.endPointModels,
                method: 'GET',
                headers: headers
            } as Params)
            let $models: RawGeminiModel[] = []
            if (response && response?.data) {
                response.data.data.map((e: any) => {
                    const name = e.id
                    const displayName = e.displayName
                    const description = null
                    const limitIn = null
                    const limitOut = null
                    const v = dayjs(e.created_at).format('YYYY-MM-DD HH:MI:SS')
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
                console.log("Claude models update")
                return true;
            } else {
                console.log("Claude models not found or exception system")
                return false;
            }

        } catch (err: any) {
            console.error(`Api extract model claude error: ${err.toString()}`)
            return false
        }
    }

}