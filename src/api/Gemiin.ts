import {callbackApi, Params} from "../utility/api.js";
import {configStore, } from "../config.js";
import {RawGeminiModel} from "../interface/myInterface.js"

const endpointStream = `https://generativelanguage.googleapis.com/v1beta/models/@model:streamGenerateContent?alt=sse&key=@apiKey`;
const endpointModel = `https://generativelanguage.googleapis.com/v1beta/models?key=@apiKey`
const config = configStore
const apiKeyGemini = () => {
    if (config.get('providers.gemini.apiKey'))
        return config.get('providers.gemini.apiKey')
    else throw new Error("ApyKey for Gemini not found")
}
export const GeminiSincro = async () => {
    try {
        
        const url = endpointModel.toString().replace('@apiKey', apiKeyGemini())
        // @ts-ignore
        const r = await callbackApi<any[]>({
            url: url,
            method: 'GET'
        } as Params)
        let $models: RawGeminiModel[] = []
        console.log("Api response 👍, continue an create or replace gemini models")
        if (r && r?.models) {
            r.models.map((e: any) => {
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
        if ($models.length > 0)
            config.set('providers.gemini.models', $models)
    } catch (err:any) {
        throw new Error(`Api extract model gemini error: ${err.toString()}`)
    }

}
/**
 * export const getBodyStream = (history: ChatMessage) => {
 *     const c = getHistoryContent(history)
 *     const body = {
 *         c,
 *         systemInstruction: {
 *             parts: [
 *                 {
 *                     text: instruction
 *                 }
 *             ]
 *         }
 *     };
 *     return body;
 * }
 * export const GeminiStream = async (model:string, history:ChatMessage) => {
 *     try{
 *         const url = endpointStream.toString().replace('@apiKey',apiKeyGemini()).replace('model',model)
 *         const r = await callbackApi<any[]>({
 *             url:url,
 *             method: 'POST',
 *             headers: {
 *                 'Content-Type': 'application/json'
 *             },
 *             payload: getBodyStream(history)
 *         } as Params)
 *         if(r){
 *
 *         }
 *     }catch (err){
 *         throw new Error(`Api stream gemini error: ${err.toString()}`)
 *
 *     }
 *
 * }
 */
