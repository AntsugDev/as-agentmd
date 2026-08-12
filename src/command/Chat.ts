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

export class Chat extends AbstractProgram {

    private spinner: Ora | null;
    private r: Interface;

    constructor(program: Command) {
        super(program);
        this.spinner = null;
        this.r = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
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


    private getProviderModel(p: string | null, msg: string | any[] | any, input: string | null): any | null {
        try {

            let _class: any | null = null;
            if (p) {
                switch (p) {
                    case 'ollama' :
                        _class = new Ollama();
                    case 'gemini':
                        _class = new Gemini()
                    case 'openai':
                        _class = new OpenAi();
                    default:
                        throw new Error("Provider not found")
                }
            }
            if (_class) {
                if (p !== 'gemini')
                    return _class.chat(msg)
                else
                    return _class.chat(input)
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

                    this.r.setPrompt('User > ')
                    this.r.prompt();
                    const p = this.selectedProvider();
                    const chat = new ChatClass(p)
                    chat.init()
                    trace(` ---- INIT NEW CHAT IN DATE ${dayjs().format('YYYY-MM-DD HH:MI:SS')} --- \n\r`)

                    this.r.on('line', async (input) => {
                        let inTrim = input.trim()
                        if (inTrim === 'exit' || inTrim === 'quit' || inTrim === 'q') {
                            trace(`--- CHAT TERMINATED IN DATE ${dayjs().format('YYYY-MM-DD HH:MI:SS')} ----\n\r`)
                            console.log("Chat terminated")
                            setTimeout(() => {
                                this.r.close()
                                process.exit(1)
                            }, 2000)
                            return;
                        }

                        if (inTrim === '') {
                            this.r.prompt();
                            return;
                        }
                        this._w()
                        chat.pUser(inTrim)
                        if (!['exit', 'quit', 'q'].includes(inTrim))
                            trace(`User > ${inTrim}`)

                        let msg: any[] = chat.msg
                        let agent = this.getProviderModel(p, msg, inTrim);

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
                            this.r.close()
                            process.exit(1)
                        }

                        this._c()
                        this.r.prompt();
                    })
                })

        } catch (err: any) {
            console.error("Error chat")
        }
    }

}