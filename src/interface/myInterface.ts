
export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    defaultModel: string;
    models: string[];
}

export interface AgentConfig {
    activeProvider: string;
    lastUpdated?: string;
    providers: Record<string, ProviderConfig>;
}


export interface RawGeminiModel {
    name: string;
    displayName?: string;
    description?: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    version?: string
}
export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}