import readlinePromises from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { marked } from 'marked';
import markedTerminal from 'marked-terminal';
import { configStore } from './config.js';
import {trace} from "./utility/csv.js";

marked.setOptions({
    renderer: new markedTerminal({
        code: (code: string) => `\x1b[33m${code}\x1b[0m`,
        blockquote: (body: string) => `\x1b[90m\x1b[3m${body}\x1b[0m`,
        heading: (text: string) => `\x1b[1m\x1b[36m${text}\x1b[0m\n`,
        firstHeading: (text: string) => `\x1b[1m\x1b[35m${text}\x1b[0m\n`,
        strong: (text: string) => `\x1b[1m\x1b[37m${text}\x1b[0m`,
        em: (text: string) => `\x1b[3m${text}\x1b[0m`,
        link: (href: string, text: string) => `\x1b[4m\x1b[34m${text || href}\x1b[0m`
    })
});

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

/**
 * Stampa formattata dell'intestazione risposta dell'Agente
 */
function printAgentHeader(modelId: string) {
    console.log(`\n┌─ 🤖 \x1b[1m\x1b[32mAgentMD\x1b[0m \x1b[90m(${modelId})\x1b[0m`);
    console.log(`└─────────────────────────────────────────────────────\n`);
}

/**
 * Stampa formattata del footer di fine risposta
 */
function printAgentFooter() {
    console.log(`\n──────────────────────────────────────────────────────\n`);
}

/**
 * Renderizza e stampa il Markdown finale formattato nel terminale
 */
function renderMarkdownOutput(rawText: string) {
    try {
        const formatted = marked.parse(rawText);
        // Pulizia terminale e sovrascrittura con la versione formattata pulita
        trace(formatted)
        process.stdout.write(`\r${formatted}`);
    } catch {
        // Fallback in testo semplice se il parser incontra un errore
        process.stdout.write(rawText);
        trace(rawText)

    }
}

/**
 * Punto di ingresso per la chat interattiva (run-chat)
 */
export async function runChatSession(initialMessageInput?: string | string[]) {
    let initialMessage = '';
    if (Array.isArray(initialMessageInput)) {
        initialMessage = initialMessageInput.join(' ').trim();
    } else if (typeof initialMessageInput === 'string') {
        initialMessage = initialMessageInput.trim();
    }
    trace(initialMessage);
    const activeProvider = configStore.get('activeProvider') || 'gemini';
    const providerConfig = configStore.get(`providers.${activeProvider}`) as any;

    if (!providerConfig) {
        console.error(`❌ Errore: Provider "${activeProvider}" non configurato.`);
        console.error(`👉 Configuralo con: agentmd config set-key ${activeProvider} <TUA_KEY>`);
        process.exit(1);
    }

    const modelId = providerConfig.defaultModel;

    console.clear();
    console.log(`\x1b[1m\x1b[36m╭───────────────────────────────────────────────────╮\x1b[0m`);
    console.log(`\x1b[1m\x1b[36m│ 💬 AgentMD Interactive Chat Engine                │\x1b[0m`);
    console.log(`\x1b[1m\x1b[36m╰───────────────────────────────────────────────────╯\x1b[0m`);
    console.log(`🤖 Modello Attivo: \x1b[32m${modelId}\x1b[0m (\x1b[35m${activeProvider.toUpperCase()}\x1b[0m)`);
    console.log(`💡 Digita '\x1b[33mexit\x1b[0m' o '\x1b[33mquit\x1b[0m' per terminare la sessione.\n`);

    await startInteractiveSession(initialMessage, modelId, activeProvider, providerConfig);
}

/**
 * Gestore del ciclo REPL della chat interattiva
 */
async function startInteractiveSession(
    initialPrompt: string,
    model: string,
    provider: string,
    providerConfig: any
) {
    const rl = readlinePromises.createInterface({ input, output });
    const history: ChatMessage[] = [];

    let nextInput: string | null = initialPrompt;

    while (true) {
        if (nextInput) {
            history.push({ role: 'user', text: nextInput });

            printAgentHeader(model);

            let responseText = '';
            if (provider === 'gemini') {
                responseText = await runGeminiChat(history, model, providerConfig.apiKey);
            } else if (provider === 'ollama') {
                responseText = await runOllamaChat(history, model, providerConfig.baseUrl || 'http://localhost:11434');
            } else {
                console.error(`⚠️ Il provider "${provider}" non è ancora supportato.`);
                rl.close();
                break;
            }

            if (responseText) {
                history.push({ role: 'model', text: responseText });
            }

            printAgentFooter();
        }

        const userInput = await rl.question('\x1b[1m\x1b[36m👤 You > \x1b[0m');

        if (['exit', 'quit', 'q'].includes(userInput.trim().toLowerCase())) {
            console.log('\n👋 Sessione terminata. Alla prossima!');
            rl.close();
            break;
        }

        if (!userInput.trim()) {
            nextInput = null;
            continue;
        }

        nextInput = userInput.trim();
    }
}

/**
 * Gestore Chat per Gemini
 */
async function runGeminiChat(history: ChatMessage[], model: string, apiKey: string): Promise<string> {
    if (!apiKey) {
        console.error(`❌ Errore: API Key per Gemini non trovata.`);
        return '';
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const contents = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    const body = {
        contents,
        systemInstruction: {
            parts: [
                {
                    text: `You are an expert AI Software Developer Agent in a terminal environment. 
Provide concise, well-structured answers using clean Markdown formatting.`
                }
            ]
        }
    };

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.json();
            console.error(`\n❌ Errore API Gemini (${response.status}):`, errText?.error?.message ?? "La chat è andata in errore, riprovare più tardi o a cambiare model");
            process.exit(1)
            return '';
        }

        if (!response.body) return '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.replace('data: ', '').trim();
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const data = JSON.parse(jsonStr);
                        const chunkText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (chunkText) {
                            process.stdout.write(chunkText);
                            fullResponse += chunkText;
                        }
                    } catch {
                        // Ignora i frammenti JSON incompleti durante lo streaming
                    }
                }
            }
        }

        // Renderizziamo la risposta completa formattata a fine streaming
        if (fullResponse) {
            console.clear();
            printAgentHeader(model);
            renderMarkdownOutput(fullResponse);
        }

        return fullResponse;
    } catch (error: any) {
        console.error('❌ Errore durante la connessione a Gemini:', error.message);
        return '';
    }
}

/**
 * Gestore Chat per Ollama
 */
async function runOllamaChat(history: ChatMessage[], model: string, baseUrl: string): Promise<string> {
    const endpoint = `${baseUrl}/api/chat`;

    const messages = history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.text
    }));

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) {
            console.error(`\n❌ Errore Ollama (${response.status})`);
            return '';
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        if (!reader) return '';

        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);

                        if (data.message?.content) {
                            process.stdout.write(data.message.content);
                            fullResponse += data.message.content;
                        }
                    } catch {
                        // Ignora i frammenti durante lo streaming
                    }
                }
            }
        }

        // Renderizziamo la risposta formattata pulita a fine streaming
        if (fullResponse) {
            console.clear();
            printAgentHeader(model);
            renderMarkdownOutput(fullResponse);
        }

        return fullResponse;
    } catch (error: any) {
        console.error('\n❌ Errore durante la connessione a Ollama:', error.message);
        return '';
    }
}