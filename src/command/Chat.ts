import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import readline from "node:readline";
import {trace} from "../utility/csv.js";

export class Chat extends AbstractProgram {
    constructor(program: Command) {
        super(program);
    }

    getData(): void {
    }

    getDataAll(): void {
    }

    setData(): void {
        try {
            this.program.command('chat').description("Chat")
                .action(() => {
                    let model = this.config.get('modelSelected')
                    if (!model) {
                        console.warn(`4️⃣0️⃣4️⃣ No model has been selected for the chat; before proceeding, use the "select-model" command to select the desired model.`)
                        process.exit(1)
                    }
                    console.log("-------------------------")
                    console.log(`Welcome back, chat with ${model}`)
                    console.log("-------------------------")
                    const r = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    })
                    r.setPrompt('User > ')
                    r.prompt();
                    r.on('line', (input) => {
                        let inTrim = input.trim()

                        if (inTrim === 'exit' || inTrim === 'quit' || inTrim === 'q') {
                            console.log("Chat terminated")
                            r.close()
                        }
                        trace(inTrim)
                    })


                })


        } catch (err: any) {
            console.error("Error chat")
        }
    }

}