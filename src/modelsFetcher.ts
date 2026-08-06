import { configStore, ModelDetail } from './config.js';

// --- 1. GOOGLE GEMINI ---
interface RawGeminiModel {
    name: string;
    displayName?: string;
    description?: string;
    inputTokenLimit?: number;
    outputTokenLimit?: number;
}

async function fetchGeminiModelsDetails(apiKey: string): Promise<ModelDetail[]> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        if (!response.ok) return [];

        const data = (await response.json()) as { models?: RawGeminiModel[] };
        if (!data.models) return [];

        return data.models
            .filter((m) => m.name.includes('gemini'))
            .map((m) => {
                const id = m.name.replace('models/', '');
                return {
                    id: id,
                    displayName: m.displayName || id,
                    description: m.description || 'Modello generico Gemini per generazione testo e analisi.',
                    inputTokenLimit: m.inputTokenLimit,
                    outputTokenLimit: m.outputTokenLimit
                };
            });
    } catch {
        return [];
    }
}

// --- 2. OPENAI (ChatGPT) ---
interface RawOpenAIModel {
    id: string;
}

async function fetchOpenAIModelsDetails(apiKey: string): Promise<ModelDetail[]> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        if (!response.ok) return [];

        const data = (await response.json()) as { data?: RawOpenAIModel[] };
        if (!data.data) return [];

        // Mappa di fallback per token limit di OpenAI
        const knownLimits: Record<string, { in: number; out: number; desc: string }> = {
            'gpt-4o': { in: 128000, out: 16384, desc: 'Flagship model per reasoning e vision' },
            'gpt-4o-mini': { in: 128000, out: 16384, desc: 'Modello ultra-veloce ed economico' },
            'o1': { in: 200000, out: 100000, desc: 'Modello avanzato di ragionamento complesso' },
            'o3-mini': { in: 200000, out: 100000, desc: 'Reasoning model compatto e veloce' }
        };

        return data.data
            .filter((m) => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3'))
            .map((m) => {
                const info = knownLimits[m.id] || { in: 128000, out: 4096, desc: 'Modello OpenAI Generativo' };
                return {
                    id: m.id,
                    displayName: m.id,
                    description: info.desc,
                    inputTokenLimit: info.in,
                    outputTokenLimit: info.out
                };
            });
    } catch {
        return [];
    }
}

// --- 3. ANTHROPIC (Claude) ---
interface RawAnthropicModel {
    id: string;
    display_name?: string;
}

async function fetchAnthropicModelsDetails(apiKey: string): Promise<ModelDetail[]> {
    try {
        const response = await fetch('https://api.anthropic.com/v1/models', {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            }
        });
        if (!response.ok) return [];

        const data = (await response.json()) as { data?: RawAnthropicModel[] };
        if (!data.data) return [];

        return data.data.map((m) => {
            let desc = 'Modello Anthropic Claude';
            let inLimit = 200000;
            let outLimit = 8192;

            if (m.id.includes('sonnet')) {
                desc = 'Standard d’oro per generazione codice e analisi approfondita.';
            } else if (m.id.includes('haiku')) {
                desc = 'Modello Claude ultra-veloce per risposte immediate.';
            } else if (m.id.includes('opus')) {
                desc = 'Modello per ragionamenti ad altissima complessità.';
            }

            return {
                id: m.id,
                displayName: m.display_name || m.id,
                description: desc,
                inputTokenLimit: inLimit,
                outputTokenLimit: outLimit
            };
        });
    } catch {
        return [];
    }
}

// --- 4. OLLAMA (Locale) ---
interface RawOllamaModel {
    name: string;
    details?: {
        family?: string;
        parameter_size?: string;
    };
}

async function fetchOllamaModelsDetails(baseUrl = 'http://localhost:11434'): Promise<ModelDetail[]> {
    try {
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) return [];

        const data = (await response.json()) as { models?: RawOllamaModel[] };
        if (!data.models) return [];

        return data.models.map((m) => {
            const family = m.details?.family || 'Local LLM';
            const size = m.details?.parameter_size || 'N/A';
            return {
                id: m.name,
                displayName: m.name,
                description: `Modello locale Ollama (Architettura: ${family}, Parametri: ${size})`,
                inputTokenLimit: 8192,
                outputTokenLimit: 4096
            };
        });
    } catch {
        // Se Ollama non è in esecuzione in locale, restituisce lista vuota senza blocco
        return [];
    }
}

// --- CONTROLLORE GLOBALE SINCRONIZZAZIONE ---
export async function syncModelsIfExpired(force = false): Promise<boolean> {
    const config = configStore.store;
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    if (!force && config.lastUpdated && now - config.lastUpdated < THIRTY_DAYS_MS) {
        return false;
    }

    let updated = false;

    // 1. Sync Gemini
    if (config.providers.gemini?.apiKey) {
        const details = await fetchGeminiModelsDetails(config.providers.gemini.apiKey);
        if (details.length > 0) {
            configStore.set('providers.gemini.modelsDetails', details);
            configStore.set('providers.gemini.models', details.map((d) => d.id));
            updated = true;
        }
    }

    // 2. Sync OpenAI
    if (config.providers.openai?.apiKey) {
        const details = await fetchOpenAIModelsDetails(config.providers.openai.apiKey);
        if (details.length > 0) {
            configStore.set('providers.openai.modelsDetails', details);
            configStore.set('providers.openai.models', details.map((d) => d.id));
            updated = true;
        }
    }

    // 3. Sync Anthropic
    if (config.providers.anthropic?.apiKey) {
        const details = await fetchAnthropicModelsDetails(config.providers.anthropic.apiKey);
        if (details.length > 0) {
            configStore.set('providers.anthropic.modelsDetails', details);
            configStore.set('providers.anthropic.models', details.map((d) => d.id));
            updated = true;
        }
    }

    // 4. Sync Ollama
    const ollamaUrl = config.providers.ollama?.baseUrl || 'http://localhost:11434';
    const ollamaDetails = await fetchOllamaModelsDetails(ollamaUrl);
    if (ollamaDetails.length > 0) {
        configStore.set('providers.ollama.modelsDetails', ollamaDetails);
        configStore.set('providers.ollama.models', ollamaDetails.map((d) => d.id));
        updated = true;
    }

    if (updated || force) {
        configStore.set('lastUpdated', now);
    }

    return updated;
}