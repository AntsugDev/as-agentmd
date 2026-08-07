import {AbstractProgram} from "../utility/abstractProgram.js";
import {Command} from "commander";
import {GeminiSincro} from "../api/Gemiin.js";

export class Sync extends AbstractProgram{

    constructor(program:Command) {
        super(program);
    }

    getData(key: string): any {
        return null;
    }

    getDataAll(): void {
    }
    private async sync(){
        try{
          await GeminiSincro();

        }catch (err:any) {
            throw new Error(`Exception set syncro ${err.toString()}`)
        }
    }

    setData(): void {
        try{
            this.program.command('sync').description('Sync models').action(() => {
                console.log("🏃 ... init sync models ...")
                this.sync()
            })
        }catch (err:any) {
           throw new Error(`Exception set syncro ${err.toString()}`)
        }
    }

}
