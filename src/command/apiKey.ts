import {Command, program} from "commander";
import readline from "node:readline";
import {configStore, providers} from "../config.js";
import {AbstractProgram} from "../utility/abstractProgram.js";


export class ApiKey extends AbstractProgram {

    constructor(program: Command) {
        super(program);
    }

    public getData(): void {

    }
    public getDataAll(){
        try{
            this.program.command('get-key').description('View provider with insert apiKey').action(() => {
                this.providers.map((e:string) => {
                    if(e === 'ollama')
                        console.log("❗ Ollama is not neccessary apiKey")
                    const apiKey = this.config.get(`providers.${e}.apiKey`)
                    if(apiKey)
                        console.log(`👌 ${e} you have register apiKey ${apiKey.toString().replace(apiKey.substring(0,apiKey.toString().length),('*').toString().repeat(apiKey.toString().length))}`)
                })
            })

        }catch (err:any){
            throw new Error("set data key error:" + err.toString())
        }
    }

    public setData(): void {
        try {
            this.program.command('set-key').description('Set Api key for Providers')
                .action(() => {
                        this.providers.forEach((e: string, i: number) => {
                            console.log(`${i}:${e}`)
                        })
                        const r = readline.createInterface({
                            input: process.stdin,
                            output: process.stdout
                        })

                        r.question("Select an providers from to list up:  ", (answer) => {
                            const choice = parseInt(answer.trim())
                            const selected = this.providers.find((e: string, i: number) => {
                                return i === choice
                            })
                            if (selected) {
                                r.question("Insert you api key: ", (answer2) => {
                                    const apiKey = answer2.trim();
                                    if (apiKey) {
                                        configStore.set(`providers.${selected}.apiKey`, apiKey);
                                        console.log(`✅ API Key inserted/updated for ${selected} provider`);
                                    } else {
                                        console.error('❌ API Key cannot be empty');
                                    }
                                    r.close()
                                })
                            } else {
                                console.error("❌ Provider not found")
                                r.close()
                                process.exit(1)
                            }

                        })

                    }
                )
        } catch (err: any) {
            console.error(`Exception set data key ${err.toString()}`)
        }

    }


}
