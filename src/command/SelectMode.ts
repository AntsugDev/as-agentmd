import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import readline from "node:readline";
import {RawGeminiModel} from "../interface/myInterface.js";
import {configStore} from "../config.js";
import {DataUtility} from "../utility/DataUtility.js";

export class SelectMode extends AbstractProgram {

    constructor(program: Command) {
        super(program);
    }

    getData(): void {
    }

    getDataAll(): void {
    }

    setData(): void {
        this.program.command('select-model').description("Select model, for use question").action(() => {
            try {
                let count: number = 1;
                this.providers.map((e: string) => {
                    console.log(`ℹ️ ${count}: ${e}`)
                    count++;
                })
                const r = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                })
                r.question(`📶 Select provider:  `, (a) => {
                    const provider = this.providers[(parseInt(a) - 1)]
                    let models: RawGeminiModel[] | null | undefined = [];
                    if (provider) {
                        const dataUtility = new DataUtility(provider)
                        models = dataUtility.getModels()
                    }
                    if (models) {
                        let cSecond: number = 1;
                        models.map((e: RawGeminiModel) => {
                            console.log(`${cSecond}: ${e.displayName}`)
                            cSecond++;
                        })
                        r.question("🆕 Select model from list: ", (b) => {
                            const modelSelected = models[(parseInt(b) - 1)]
                            if (modelSelected) {
                                configStore.set('modelSelected', `${provider}|${modelSelected.name}`)
                                console.log(`Select model ${provider}|${modelSelected.displayName} for questions`)
                            } else {
                                console.error(`Models not selected`)
                            }
                            r.close()
                        })

                    } else {
                        console.warn(`For the provider selected, not models found`)
                        r.close()
                        process.exit(1)
                    }

                });
            } catch (err: any) {
                console.error(`Exception select models ${err.toString()}`)
            }

        })

    }

}