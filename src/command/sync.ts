import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import {Gemini} from "../api/Gemiin.js";
import {RawGeminiModel} from "../interface/myInterface.js";
import fs from "fs";
import {Ollama} from "../api/Ollama.js";
import dayjs from "dayjs";

export class Sync extends AbstractProgram {

    constructor(program: Command) {
        super(program);
    }

    getData(): any {
        try {
            this.program.command('get-models').description("With this command search and view list from providers selected, the list data models.").option("-p, --providers <string>", "Providers from the list config")
                .action((options) => {
                    const p = options.providers
                    if (!p) {
                        console.error(`4️⃣0️⃣0️⃣ - Option --providers or -p is required.`)
                        process.exit(1)
                    }
                    if (!this.providers.includes(p)) {
                        console.error(`4️⃣0️⃣4️⃣ - The providers selected ${p} not found `)
                        process.exit(1)
                    }

                    const models = this.config.get(`providers.${p}.models`);

                    fs.writeFile(`./files/${p}.models.json`, JSON.stringify(models, null, 2), 'utf-8', (error) => {
                        if (error)
                            console.error("Exception created file json ", error)
                    })
                    console.log(`🔭 For this ${p},the system create files json into directory "files"`);
                })

        } catch (err: any) {
            console.error(`Exception from request data.(${err.toString()})`)
        }
    }

    getDataAll(): void {
    }

    private async sync() {
        try {
            let sync: number = 0;
            if (await new Gemini().sincro()) sync++
            if (await new Ollama().sincro()) sync++;

            if (sync > 0)
                this.config.get('lastUpdated', dayjs().format('YYYYMMDD'));

        } catch (err: any) {

            throw new Error(`Exception set syncro ${err.toString()}`)
        }
    }

    setData(): void {
        try {
            this.program.command('sync').description('Sync models').action(() => {
                console.log("🏃 ... init sync models ...")
                this.sync()
            })
        } catch (err: any) {
            throw new Error(`Exception set syncro ${err.toString()}`)
        }
    }

}
