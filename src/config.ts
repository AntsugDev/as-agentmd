import Conf from 'conf';
import {AgentConfig} from "./interface/myInterface.js";
import dayjs from "dayjs";
const schemaDefaults: AgentConfig = {
    activeProvider: 'gemini',
    lastUpdated: dayjs().format('YYYYMMDD'),
    providers: {
        gemini: {
            apiKey: '',
            defaultModel: 'gemini-2.5-flash',
            models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash']
        },
        deepseek:{
            apiKey: '',
            defaultModel: '',
            models: []
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

export const providers = (): string[] => {
    if(configStore){
        const p = configStore.get('providers')
        return Object.keys(p)
    }
    return []
}

