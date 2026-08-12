import {ApiAbstract} from "./ApiAbstract.js";
import {Mistral} from "@mistralai/mistralai";
import {RawGeminiModel} from "../interface/myInterface.js";
import {UsageInfo} from "@mistralai/mistralai/models/components";

export class MistralClass extends ApiAbstract{

    constructor() {
        super('mistral', '','');
    }
    // @ts-ignore
    async chat(text: any[]): string | object | null {
        try {
            const key = this.extraApiKey()
            const models = this.getModelSelect()
            if (!key) {
                console.error("Key not found")
                return null;
            }
            if (!models) {
                console.error("Models not selected")
                return null;
            }
            const client = await new Mistral({
                apiKey: key.trim(),
            })
            const response =await  client.chat.complete({
                model: models,
                messages: text,
                temperature:0.5
            })
            if (response) {
                const usage:UsageInfo|null = response.usage
                if (usage) {
                    const input = usage?.promptTokens ?? 0;
                    const output = usage?.completionTokens ?? 0;
                    console.log(`---Utilizzo dei token-----`)
                    console.log(`Input(user): ${input}`)
                    console.log(`Output(Agent): ${output}`)
                    console.log('--------------------------------------------')
                }
                return response?.choices[0]?.message?.content ?? "Error"
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
            this.preProviderInstance();
            const key = this.extraApiKey()
            if(!key){
                console.error("Key not found")
                return false;
            }
            const response = await new Mistral({
                apiKey: key.trim(),
            }).models.list()
            let $models: RawGeminiModel[] = []
            if(response && response?.data){
                response.data.map((e: any) => {
                    const name = e.id
                    const displayName = e.name
                    const description = e.description
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
                console.log("Mistral models update")
                return true;
            } else {
                console.log("Mistral models not found or exception system")
                return false;
            }

        }catch (err:any){
            console.error(`Api extract model mistral error: ${err.toString()}`)
            return false;
        }
    }

}