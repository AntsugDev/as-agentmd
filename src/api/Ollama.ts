import {callbackApi} from "../utility/api.js";
import {RawGeminiModel} from "../interface/myInterface.js";

export const baseUrlOllama = "http://localhost:11434"
export const endpointOllama = "http://localhost:11434/api/tags"


export const OllamaRun:boolean = async () => {
    try {
        const response = await callbackApi({
            url: baseUrlOllama,
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
        if(OllamaRun()) {
            const response = await callbackApi({
                url: endpointOllama,
                method: 'GET'
            })
            if (response && response?.models) {
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
                if ($models.length > 0)
                    config.set('providers.ollama.models', $models)

            }
        }else{
            console.warn("Ollama or is not installed or not running")
        }

    } catch (err: any) {
        console.log(`Ollama sync runnig error ${err.toString()}`)
    }
}