import {ApiAbstract} from "./ApiAbstract.js";
import {AxiosHeaders} from "axios";
import {callbackApi, Params} from "../utility/api.js";
import {RawGeminiModel} from "../interface/myInterface.js";

export class DeepSeek extends ApiAbstract{
    constructor(files:any|null) {
        super('deep-seek', 'https://api.deepseek.com/v1/models?provider=deepseek', 'https://api.deepseek.com/v1/chat/completions',files);
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
       try{

           const key = this.extraApiKey()
           const model = this.getModelSelect()
           if(!key) {
               console.error("Key for deep-seek not found")
               return null;
           }
           const headers = new AxiosHeaders()
           headers.set('Authorization', `Bearer ${key.trim()}`)
           headers.set('Content-Type', `application/json`)
           const response = await callbackApi({
               url: this.endPointModels,
               method: 'Post',
               headers:headers,
               payload:{
                   "model": model,
                   "messages": text,
                   "temperature": 0.5,
                   "max_tokens": 1024,
                   "top_p": 0.9,
                   "frequency_penalty": 0.5,
                   "presence_penalty": 0.5,
                   "stream": false
               }
           }as Params)

           if (response) {
               const usage = response.usage
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
               return response.data.choices[0].message.content
           }

           return null;
       } catch (err: any) {
           console.error(err.toString())
           return null;
       }
    }
// @ts-ignore
    async sincro(): Promise<boolean> | boolean {
        try{
            this.preProviderInstance()
            const key = this.extraApiKey()
            if(!key) {
                console.error("Key for deep-seek not found")
                return false;
            }
            const headers = new AxiosHeaders()
            headers.set('Authorization', `Bearer ${key.trim()}`)
            headers.set('Content-Type', `application/json`)
            const response = await callbackApi({
                url: this.endPointModels,
                method: 'GET',
                headers:headers
            }as Params)
            let $models: RawGeminiModel[] = []
            if (response && response?.data) {
                response.data.data.map((e: any) => {
                    const name = e.id
                    const displayName = e.id
                    const description = null
                    const limitIn = null
                    const limitOut = null
                    const v = null
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
           console.error(`Api extract model deep-seek error: ${err.toString()}`)
            return false
        }
    }

}