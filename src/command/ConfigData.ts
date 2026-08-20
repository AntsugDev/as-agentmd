import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import fs from 'fs';
import dayjs from "dayjs";

export class ConfigData extends AbstractProgram {

    constructor(program: Command) {
        super(program);
    }

    getData(): void {
        this.program.command('config-last-update').description("Verify last update models").action(() => {
            const data = this.config.get('lastUpdated')
            if (data) {
                const format = dayjs(data).format('YYYY-MM-DD')
                console.log(`Last update ${format}`)
            }
            else console.log("Last update not found ")
        })
    }

    getDataAll(): void {
        this.program.command('config')
            .description("List check config")
            .action(() => {
                try {
                    const providers = this.config.get('providers')
                    const lastUpdate = this.config.get('lastUpdated')
                    const selectedModel = this.config.get('modelSelected')
                    if (fs.existsSync('./files/config.json'))
                        fs.rmSync('./files/config.json')

                    fs.writeFile('./files/config.json',`//model selected: ${selectedModel} and last update: ${lastUpdate}\n${JSON.stringify(providers, null, 2)}`, 'utf8', (error) => {
                        if (error) {
                            console.log('File not created')
                        }
                    })
                    console.log(`👍 File created in the 'files' directory. It will be deleted in 3 minutes for security reasons.`)

                    setTimeout(() => {
                        if (fs.existsSync('./files/config.json'))
                            fs.rmSync('./files/config.json')
                        console.log('❗ File Deleted.')
                    }, 180000)
                } catch (err: any) {
                    console.error(`Exception into list data config: ${err.toString()}`)
                }
            })

    }

    setData(): void {
        this.program.command('refresh-config').description("refresh-config").action(() => {
            this.config.clear()
            this.config.set('activeProvider', 'gemini')
            this.config.set('modelSelected', null)
            this.config.set('lastUpdated', dayjs().format('YYYYMMDD'))
            this.config.set('providers', {
                "gemini":null,
                "ollama":null,
                "openai": null,
                "claude":null,
                "deep-seek": null,
                "mistral": null,
            })
        })
    }

}