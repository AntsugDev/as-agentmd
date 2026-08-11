import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import readline from "node:readline";
import {trace} from "../utility/csv.js";
import dayjs from "dayjs";
import {ChatClass} from "../utility/ChatClass.js";
import {Ollama} from "../api/Ollama.js";
import ora from "ora";
import {Gemini} from "../api/Gemiin.js";

export class Chat extends AbstractProgram {
    constructor(program: Command) {
        super(program);
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
                .action(async () => { // Trasformato in async se usi await dentro
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

                    const r = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    })

                    // Impostiamo il prompt fisso per l'utente
                    r.setPrompt('User > ')
                    r.prompt();
                    const p = this.selectedProvider();
                    const chat = new ChatClass(p)
                    chat.init()
                    trace(` ---- INIT NEW CHAT IN DATE ${dayjs().format('YYYY-MM-DD HH:MI:SS')} --- \n\r`)

                    r.on('line', async (input) => {
                        let inTrim = input.trim()

                        // Gestione uscita
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
                        const spinner = ora({
                            prefixText: '🕐 ',
                            text: "Attendi la risposta del modello ...",
                            color: 'yellow'
                        }).start()
                        chat.pUser(inTrim)
                        if (!['exit', 'quit', 'q'].includes(inTrim))
                            trace(`User > ${inTrim}`)

                        let msg: any[] = chat.msg
                        let agent = null;


                        if (!p) {
                            console.log("Impossibile estrarre il provider in uso")
                            r.prompt();
                            return;
                        }
                        if (p === 'ollama') {
                            agent = await new Ollama().chat(msg)
                        } else {
                            agent = await gemini.chat(inTrim)
                        }
                        if (agent) {
                            spinner.succeed('')
                            let msg = `Agent > ${agent}`
                            console.log(msg)
                            trace(msg)
                            if (typeof agent === 'string')
                                chat.pAgent(agent)
                        } else {
                            console.log(`Agent > Ho avuto problemi, chiudo la chat riprova più tardi o cambia modello`)
                            trace(`--- CHAT TERMINATED(Problemi model) IN DATE ${dayjs().format('YYYY-MM-DD HH:MI:SS')} ----\n\r`)
                            spinner.stop()
                            r.close()
                            process.exit(1)
                        }

                        spinner.clear()
                        r.prompt();
                    })
                })

        } catch (err: any) {
            console.error("Error chat")
        }
    }

}