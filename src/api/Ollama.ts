import {callbackApi} from "../utility/api.js";
import {RawGeminiModel} from "../interface/myInterface.js";
import {configStore} from "../config.js";
import {clearModels, getProvider, preProviderInstance, setModels} from "../utility/utility.js";

export const baseUrlOllama = "http://localhost:11434"
export const endpointOllama = "http://localhost:11434/api/tags"
const config = configStore

export const OllamaRun = async () :Promise<boolean|undefined> => {
    try {
        const response = await callbackApi({
            url: baseUrlOllama.toString(),
            method: 'GET'
        })
        if(response && parseInt(response.status) === 200)
            return true;

        return false;

    } catch (err: any) {
        console.log(`Ollama check runnig error ${err.toString()}`)
    }
}

export const OllamaSync = async () => {
    try {
        // @ts-ignore
        preProviderInstance('ollama')
        if(await OllamaRun()) {
            // @ts-ignore
            const response = await callbackApi({
                url: endpointOllama.toString(),
                method: 'GET'
            })
            if (response.data && response.data?.models) {
                clearModels('ollama')
                const $models: RawGeminiModel[] = [];
                response.data.models.map((e: any) => {
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
                    setModels($models, 'ollama')
                    console.log("Ollama models update")
                    return true;
                }else {
                    console.log("Ollama models not found or exception system")
                    return  false;
                }
            }
        }else{
            console.warn("Ollama or is not installed or not running")
            return  false;
        }

    } catch (err: any) {
        console.log(`Ollama sync runnig error ${err.toString()}`)
        return  false;
    }
}