export interface ModelDetail {
    id: string;
    displayName: string;
    description: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
}

export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    defaultModel: string;
    models: string[];
    modelsDetails?: ModelDetail[];
}

export interface AgentConfig {
    activeProvider: string;
    lastUpdated?: number;
    providers: Record<string, ProviderConfig>;
}

export interface UnifiedModelInfo {
    index: number;
    provider: string;
    id: string;
    displayName: string;
    description: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
    isCurrentDefault: boolean;
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