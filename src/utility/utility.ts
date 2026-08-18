import ora, {Ora} from "ora";
import {Ollama} from "../api/Ollama.js";
import {Gemini} from "../api/Gemiin.js";
import {OpenAi} from "../api/OpenAi.js";
import {Claude} from "../api/Claude.js";
import {DeepSeek} from "../api/DeepSeek.js";
import {MistralClass} from "../api/MistralClass.js";

export const instruction = `You are an AI agent specializing in software development, operating in a terminal environment. CORE RULES: 1. **Language**: ALWAYS respond in the language of the user's request. 2. **Format**: Use clean, well-structured Markdown (headings, lists, code blocks). 3. **Conciseness**: Be direct and concise. Get straight to the point without digressions. 4. **Focus**: Stay focused on the original request. If the user strays too far from the initial topic, kindly ask if they prefer to: - Continue in the new direction - Return to the original topic - Start a new conversation 5. **Code**: When providing code, include: - An explanation before the code - The code in Markdown blocks with the language specified (e.g., \`\`\`python) - Usage or output examples where helpful 6. **Assumptions**: If details needed to answer are missing, make reasonable assumptions but **clearly state them** to the user. 7. **Terminal**: Keep in mind that the user is working in a terminal environment, so: - Suggest commands ready for copy-pasting - Avoid references to graphical user interfaces (GUIs) - Consider cross-platform compatibility (Linux/macOS/Windows) where appropriate 8. **Limitations**: If you do not know something or the request falls outside your expertise, admit it honestly.`
export const wait = (): Ora => {
    return ora({
        prefixText: '🕐 ',
        text: "Attendi la risposta del modello ...",
        color: 'yellow'
    }).start()
}
export const wStop = (w: Ora | null): void => {
    if (w)
        w.stop()
}
export const wClear = (w: Ora | null): void => {
    if (w)
        w.clear()
}

export const getProviderModelUtility = async (p: string | null, msg: string | any[], input: string | null, files:any|null = null): Promise<any | null> => {
    try {

        let _class: any | null = null;
        if (p) {
            if (p.toString().indexOf('ollama') !== -1)
                _class = new Ollama(files);
            else if (p.toString().indexOf('gemini') !== -1)
                _class = new Gemini(files);
            else if (p.toString().indexOf('openai') !== -1)
                _class = new OpenAi(files);
            else if (p.toString().indexOf('claude') !== -1)
                _class = new Claude(files);
            else if (p.toString().indexOf('deep-seek') !== -1)
                _class = new DeepSeek(files);
            else if (p.toString().indexOf('mistral') !== -1)
                _class = new MistralClass(files);

            else {
                console.error(`Provider not found (${p})`);
                return;
            }
        }
        if (_class && p) {
            const chat = await _class.chat((p.toString().indexOf('gemini') !== -1 ? input : msg))
            if (typeof chat === 'object' && chat?.message)
                throw new Error(chat.message)
            return {m:chat,c:_class}
        }
        return null;
    } catch (err) {
        console.log('getProviderModelUtility exc', err)
        throw err;
    }

}

