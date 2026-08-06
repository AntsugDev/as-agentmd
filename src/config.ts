import Conf from 'conf';

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

const schemaDefaults: AgentConfig = {
    activeProvider: 'gemini',
    lastUpdated: 0,
    providers: {
        gemini: {
            apiKey: '',
            defaultModel: 'gemini-2.5-flash',
            models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash']
        },
        openai: {
            apiKey: '',
            defaultModel: 'gpt-4o-mini',
            models: ['gpt-4o-mini', 'gpt-4o', 'o3-mini']
        },
        anthropic: {
            apiKey: '',
            defaultModel: 'claude-3-5-sonnet-latest',
            models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest']
        },
        ollama: {
            baseUrl: 'http://localhost:11434',
            defaultModel: 'llama3.2',
            models: ['llama3.2', 'deepseek-r1']
        }
    }
};

export const configStore = new Conf<AgentConfig>({
    projectName: 'agentmd',
    defaults: schemaDefaults
});