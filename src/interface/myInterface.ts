import {AxiosHeaders} from "axios";

export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    defaultModel: string;
    models: string[];
}

export interface AgentConfig {
    activeProvider: string;
    modelSelected: string|null;
    lastUpdated?: string;
    providers: {
        gemini: ProvidersInt|null,
        ollama: ProvidersInt|null
    }
}


export interface RawGeminiModel {
    name: string;
    displayName?: string | null;
    description?: string | null;
    inputTokenLimit?: number | null;
    outputTokenLimit?: number | null;
    version?: string | null
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface getApi {
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: any | null,
    headers?: AxiosHeaders | null
}



export interface ProvidersInt {
    apiKey?: string | null,
    api?: {
        get_models: getApi,
        get_chat: getApi
    }|null,
    models?:RawGeminiModel[]| null

}