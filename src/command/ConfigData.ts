import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import fs from 'fs';

export class ConfigData extends AbstractProgram {

    constructor(program: Command) {
        super(program);
    }

    getData(): void {

    }

    getDataAll(): void {
        this.program.command('config')
            .description("List check config")
            .action(() => {
                try {
                    const providers = this.config.get('providers')
                    if (fs.existsSync('./files/config.json'))
                        fs.rmSync('./files/config.json')

                    fs.writeFile('./files/config.json', JSON.stringify(providers, null, 2), 'utf8', (error) => {
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
    }

}