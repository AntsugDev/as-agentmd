//import {ChatMessage} from "../interface/myInterface.js";
/*
export const getHistoryContent = (history: ChatMessage) => {
    try {
        return history.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.text
        }));

    } catch (e) {
        throw new Error(e.toString())
    }
}

 */

import {getApi, ProvidersInt, RawGeminiModel} from "../interface/myInterface.js";
import {configStore,} from "../config.js";
import {ApiKey} from "../command/apiKey.js";

export const getProvider = (provider: string | 'gemini' | 'ollama'): ProvidersInt | null => {
    return configStore.get(`providers.${provider}`)
}

export const preProviderInstance = (provider: string | 'gemini' | 'ollama', apiModel?: getApi | null, apiChat?: getApi | null): void => {
    const data: ProvidersInt | null = getProvider(provider)
    if (!data)
        configStore.set(`providers.${provider}`, {
            apiKey: "",
            models: [],
            api: {
                get_models: apiModel,
                get_chat: apiChat
            }

        } as ProvidersInt)
}

export const setModels = (models: any, provider: string | 'gemini' | 'ollama') => {
    const data: ProvidersInt | null = getProvider(provider)
    if (data) {
        data.models = models
        configStore.set(`providers.${provider}`, data)
    }

}

export const getModels = (provider: string | 'gemini' | 'ollama'):RawGeminiModel[] | null | undefined => {
    const data: ProvidersInt | null = getProvider(provider)
    if (data) {
        return data.models
    }
    return [];
}

export const extraApiKey = (provider: string | 'gemini' | 'ollama') => {
    const data: ProvidersInt | null = getProvider(provider)
    if (data && data.apiKey) {
        return data.apiKey
    } else {
        console.warn(`Api key not found for ${provider} selected`)
        return;
    }
}

export const instruction = `You are an AI agent specializing in software development, operating in a terminal environment. CORE RULES: 1. **Language**: ALWAYS respond in the language of the user's request. 2. **Format**: Use clean, well-structured Markdown (headings, lists, code blocks). 3. **Conciseness**: Be direct and concise. Get straight to the point without digressions. 4. **Focus**: Stay focused on the original request. If the user strays too far from the initial topic, kindly ask if they prefer to: - Continue in the new direction - Return to the original topic - Start a new conversation 5. **Code**: When providing code, include: - An explanation before the code - The code in Markdown blocks with the language specified (e.g., \`\`\`python) - Usage or output examples where helpful 6. **Assumptions**: If details needed to answer are missing, make reasonable assumptions but **clearly state them** to the user. 7. **Terminal**: Keep in mind that the user is working in a terminal environment, so: - Suggest commands ready for copy-pasting - Avoid references to graphical user interfaces (GUIs) - Consider cross-platform compatibility (Linux/macOS/Windows) where appropriate 8. **Limitations**: If you do not know something or the request falls outside your expertise, admit it honestly.`

export const clearModels = (provider: string | 'gemini' | 'ollama') => {
    let data: ProvidersInt | null = getProvider(provider)
    if (data && data.models) {
        data.models = []
        configStore.set(`providers.${provider}`, data)
    }
}