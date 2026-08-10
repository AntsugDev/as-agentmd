import {callbackApi, Params} from "../utility/api.js";
import {configStore,} from "../config.js";
import {getApi, ProvidersInt, RawGeminiModel} from "../interface/myInterface.js"
import {clearModels, extraApiKey, getProvider, preProviderInstance, setModels} from "../utility/utility.js";

const endpointStream = `https://generativelanguage.googleapis.com/v1beta/models/@model:streamGenerateContent?alt=sse&key=`;
const endpointModel = `https://generativelanguage.googleapis.com/v1beta/models?key=`
const config = configStore

export const GeminiSincro = async () => {
    try {
        preProviderInstance('gemini')
        const key = extraApiKey('gemini')
        const url = `${endpointModel}${key}`
        const r = await callbackApi({
            url: url,
            method: 'GET'
        } as Params)
        let $models: RawGeminiModel[] = []
        if (r && r?.data?.models) {
            clearModels('gemini')
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
            setModels($models, 'gemini')
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
