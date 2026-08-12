import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import readline, {Interface} from "node:readline";
import {trace} from "../utility/csv.js";
import dayjs from "dayjs";
import {ChatClass} from "../utility/ChatClass.js";
import {Ollama} from "../api/Ollama.js";
import  {Ora} from "ora";
import {Gemini} from "../api/Gemiin.js";
import {wait, wClear, wStop} from "../utility/utility.js";
import {OpenAi} from "../api/OpenAi.js";
import {Claude} from "../api/Claude.js";
import {DeepSeek} from "../api/DeepSeek.js";
import {MistralClass} from "../api/MistralClass.js";

export class Chat extends AbstractProgram {

    private spinner: Ora | null;

    constructor(program: Command) {
        super(program);
        this.spinner = null;
    }

    private _w() {
        this.spinner = wait()
    }

    private _s() {
        wStop(this.spinner)
    }

    private _c() {
        wClear(this.spinner)
    }


    private async getProviderModel(p: string | null, msg: string | any[] | any, input: string | null): Promise<any | null> {
        try {

            let _class: any | null = null;
            if (p) {
                if(p.toString().indexOf('ollama') !== -1)
                    _class = new Ollama();
                else  if(p.toString().indexOf('gemini') !== -1)
                    _class = new Gemini();
                else  if(p.toString().indexOf('openai') !== -1)
                    _class = new OpenAi();
                else  if(p.toString().indexOf('claude') !== -1)
                    _class = new Claude();
                else  if(p.toString().indexOf('deep-seek') !== -1)
                    _class = new DeepSeek();
                else  if(p.toString().indexOf('mistral') !== -1)
                    _class = new MistralClass();

                else {
                    console.error(`Provider not found (${p})`);
                    return;
                }
            }
            if (_class) {
                if (p !== 'gemini')
                    return await _class.chat(msg)
                else
                    return await _class.chat(input)
            }

            return null;

        } catch (err) {
            throw err;
        }

    }

    private selectedProvider(): string | null {
        try {
            const data: string | null = this.config.get('modelSelected')
            if (data) {
                return data.toString().split('|')[0]
            }
            return null;
        } catch (err) {
            throw err;
        }
    }


    getData(): void {
    }

    getDataAll(): void {
    }

    setData(): void {
        try {
            this.program.command('chat').description("Chat")
                .action(async () => {

                   const r = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    })

                    const gemini = new Gemini();
                    if (gemini.prevousGemini) gemini.prevousGemini = null;
                    let model = this.config.get('modelSelected')
                    if (!model) {
                        console.warn(`4️⃣0️⃣4️⃣ No model has been selected for the chat; before proceeding, use the "select-model" command to select the desired model.`)
                        process.exit(1)
                    }
                    console.log("-------------------------")
                    console.log(`👋 Welcome back, chat with ${model}`)
                    console.log("-------------------------")

                    r.setPrompt('User > ')
                    r.prompt();
                    const p = this.selectedProvider();
                    const chat = new ChatClass(p)
                    chat.init()
                    trace(` ---- INIT NEW CHAT IN DATE ${dayjs().format('YYYY-MM-DD HH:MI:SS')} --- \n\r`)

                    r.on('line', async (input) => {
                        let inTrim = input.trim()
                        if (inTrim === 'exit' || inTrim === 'quit' || inTrim === 'q') {
                            trace(`--- CHAT TERMINATED IN DATE ${dayjs().format('YYYY-MM-DD HH:MI:SS')} ----\n\r`)
                            console.log("Chat terminated")
                            setTimeout(() => {
                                r.close()
                                process.exit(1)
                            }, 2000)
                            return;
                        }

                        if (inTrim === '') {
                            r.prompt();
                            return;
                        }
                        this._w()
                        chat.pUser(inTrim)
                        if (!['exit', 'quit', 'q'].includes(inTrim))
                            trace(`User > ${inTrim}`)

                        let msg: any[] = chat.msg
                        let agent = await this.getProviderModel(p, msg, inTrim);

                        if (agent) {
                            this._s()
                            let msg = `Agent > ${agent}`
                            console.log(msg)
                            trace(msg)
                            if (typeof agent === 'string')
                                chat.pAgent(agent)
                        } else {
                            console.log(`Agent > Ho avuto problemi, chiudo la chat riprova più tardi o cambia modello`)
                            trace(`--- CHAT TERMINATED(Problemi model) IN DATE ${dayjs().format('YYYY-MM-DD HH:MI:SS')} ----\n\r`)
                            this._s()
                            r.close()
                            process.exit(1)
                        }

                        this._c()
                        r.prompt();
                    })
                })

        } catch (err: any) {
            console.error("Error chat")
        }
    }

}