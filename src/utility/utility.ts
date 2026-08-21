import ora, {Ora} from "ora";
import {Ollama} from "../api/Ollama.js";
import {Gemini} from "../api/Gemiin.js";
import {OpenAiClass} from "../api/OpenAiClass.js";
import {Claude} from "../api/Claude.js";
import {DeepSeek} from "../api/DeepSeek.js";
import {MistralClass} from "../api/MistralClass.js";
import dayjs from "dayjs";
import {ChatFe} from "../fe/ChatFe.js";

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
export const providerModels = async (models: string[] | null, status: 'init' | 'next', input: string | null, next: any | null): Promise<any | null> => {
    try {
        if (!models) return;
        const promiseAll = [];
        for (let i = 0; i < models.length; i++) {
            const split = models[i].toString().split('|');
            let provider = split[0]
            let tNext = null;
            if (next) {
                const key = models[i].toString()
                tNext = next[key] ? next[key] : null;

            }
            let uuid = Math.random().toString(36).substring(0, 10).replaceAll('.', '')
            let time = dayjs().format('YYYYMMDD')
            let nameFile = `${uuid}_${time}.json`
            if (tNext) {
                if (tNext?.uuid)
                    uuid = tNext.uuid
                if (tNext?.nameFile) {
                    nameFile = tNext.nameFile
                    time = nameFile.toString().split('_')[1].toString().replace('.json', '')
                }
            }
            if (status === 'init') {
                const role = provider?.toString().indexOf('gemini') === -1 ? 'system' : 'user'
                let s = (status === 'init')
                if (role === 'user') s = false
                await ChatFe.init(uuid, input, role, s)
            } else {
                if (input)
                    await ChatFe.user(input, uuid, nameFile)
            }
            const globalMsg: string | any[] = ChatFe.getFile(uuid)
            const agent = await getProviderModelUtility(provider, globalMsg, input, null, split[1].toString().replace('models/', ''));
            let error = null
            if (!agent) {
                ChatFe.delStorage(uuid)
                await ChatFe.del_archive(uuid, time)
                error = agent
            }else {
                await ChatFe.assistant(agent.m, uuid, nameFile)
                await ChatFe._archive(globalMsg, uuid, nameFile)
            }
            promiseAll.push({
                uuid: uuid,
                name_file: nameFile,
                model: models[i],
                msg: globalMsg.filter(e => {
                    return e.role !== 'system'
                }),
                error: error
            })


        }
        return promiseAll;

    } catch (err: any) {
        console.log(err)
        throw err;
    }
}


export const getProviderModelUtility = async (p: string | null, msg: string | any[], input: string | null, files: any | null = null, model: string | null): Promise<any | null> => {
    try {

        let _class: any | null = null;
        if (p) {
            if (p.toString().indexOf('ollama') !== -1)
                _class = new Ollama(files, model);
            else if (p.toString().indexOf('gemini') !== -1)
                _class = new Gemini(files, model);
            else if (p.toString().indexOf('openai') !== -1)
                _class = new OpenAiClass(files, model);
            else if (p.toString().indexOf('claude') !== -1)
                _class = new Claude(files, model);
            else if (p.toString().indexOf('deep-seek') !== -1)
                _class = new DeepSeek(files, model);
            else if (p.toString().indexOf('mistral') !== -1)
                _class = new MistralClass(files, model);

            else {
                console.error(`Provider not found (${p})`);
                return;
            }
        }
        if (_class && p) {
            const chat = await _class.chat((p.toString().indexOf('gemini') !== -1 ? input : msg))
            if (typeof chat === 'object' && chat?.message)
                throw new Error(chat.message)
            return {m: chat, c: _class}
        }
        return null;
    } catch (err) {
        console.log('getProviderModelUtility exc', err)
        throw err;
    }

}

