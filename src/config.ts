import Conf from 'conf';
import {AgentConfig, UnifiedModelInfo} from "./interface/myInterface.js";
const schemaDefaults: AgentConfig = {
    activeProvider: 'gemini',
    lastUpdated: 0,
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
/**
 * Ritorna la lista unificata e numerata di tutti i modelli di tutti i provider
 */
export function getAllModelsFlat(): UnifiedModelInfo[] {
    const config = configStore.store;
    const activeProvider = config.activeProvider;
    const unifiedList: UnifiedModelInfo[] = [];
    let index = 1;

    for (const [providerName, pConfig] of Object.entries(config.providers)) {
        const defaultModel = pConfig.defaultModel;
        const detailsList = pConfig.modelsDetails || [];

        if (detailsList.length > 0) {
            for (const m of detailsList) {
                unifiedList.push({
                    index: index++,
                    provider: providerName,
                    id: m.id,
                    displayName: m.displayName || m.id,
                    description: m.description || `Modello per ${providerName}`,
                    inputTokenLimit: m.inputTokenLimit,
                    outputTokenLimit: m.outputTokenLimit,
                    isCurrentDefault: providerName === activeProvider && m.id === defaultModel
                });
            }
        } else if (pConfig.models && pConfig.models.length > 0) {
            // Fallback se non ci sono ancora i details sincronizzati
            for (const modelId of pConfig.models) {
                unifiedList.push({
                    index: index++,
                    provider: providerName,
                    id: modelId,
                    displayName: modelId,
                    description: `Modello ${providerName}`,
                    isCurrentDefault: providerName === activeProvider && modelId === defaultModel
                });
            }
        }
    }

    return unifiedList;
}
export const configStore = new Conf<AgentConfig>({
    projectName: 'agentmd',
    defaults: schemaDefaults
});
/**
 * Imposta modello e provider attivo tramite scelta unificata
 */
export function selectUnifiedModel(selected: UnifiedModelInfo) {
    configStore.set('activeProvider', selected.provider);
    configStore.set(`providers.${selected.provider}.defaultModel`, selected.id);
}