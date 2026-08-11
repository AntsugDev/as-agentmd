import {callbackApi, Params} from "../utility/api.js";
import { RawGeminiModel} from "../interface/myInterface.js"
import {ApiAbstract} from "./ApiAbstract.js";
import {AxiosHeaders} from "axios";
import {instruction} from "../utility/utility.js";

export class Gemini extends ApiAbstract {

    public prevousGemini:string|null;
    constructor() {
        super('gemini',  `https://generativelanguage.googleapis.com/v1beta/models?key=`,`https://generativelanguage.googleapis.com/v1beta/interactions?key=`);
        this.prevousGemini = null;
    }

    // @ts-ignore
    async chat(text: any): null | string| object {
        try {
            const model = this.getModelSelect()
            const key = this.extraApiKey()
            if (!model) {
                console.error("Impossibile estrarre il modello da utilizzare")
                return null;
            }
            if (!key) {
                console.error("Impossibile estrarre la chiave per le chiamate")
                return null;
            }
            let url = `${this.endPointChat}`
            url +=`${key}`

            if (!url) {
                console.error("Impossibile procedere non si dispone dell'url di richiesta")
                return null;
            }
            const headers = new AxiosHeaders();
            headers.set('Content-Type', 'application/json',)
            const response = await callbackApi({
                url: url?.toString(),
                method: 'POST',
                payload: {
                    model: model.toString().replace('models/',''),
                    system_instruction: instruction,
                    input: text,
                    previous_interaction_id: this.prevousGemini
                },
                headers: headers
            })
            if (response && response.data) {
                const contents = response.data.steps[1].content[0].text
                this.prevousGemini = response.data.id
                const usage = response.data.usage
                const select: RawGeminiModel | null | undefined = this.getModels()?.find((e: RawGeminiModel) => {
                    return e.name.toString().toUpperCase().trim() === model.toString().toUpperCase().trim()
                })
                const input = usage.total_input_tokens;
                const output = usage.total_output_tokens;
                let rInput = null;
                let rOutput = null;
                console.log(`---Utilizzo dei token-----`)
                console.log(`Input(user): ${input}`)
                console.log(`Output(Agent): ${output}`)
                if (select && select.inputTokenLimit && select.outputTokenLimit) {
                    rInput = select.inputTokenLimit - input
                    rOutput = select.outputTokenLimit - output
                    console.warn(`Token residui in input ${rInput}`)
                    console.warn(`Token residui in output ${rOutput}`)
                }
                console.log('--------------------------------------------')
                if (contents) {
                    if (rInput === 0 || rOutput === 0) {
                        throw new Error("Token terminati, cambiare modello")
                    }
                    return  contents;
                }

            }
            return null;
        } catch (err: any) {
            console.error(err.toString())
            return null;
        }
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
