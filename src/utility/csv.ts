import fs from 'fs';
import {UnifiedModelInfo} from "../config.js";

const dirPath = 'files';
const createDirectory = async () => {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, {recursive: true});
    } catch (e) {
        throw new Error("Impossibile creare la directory files")
    }
}

export const csv = (record: UnifiedModelInfo[]) => {
    try {
        createDirectory();
        const filename = './files/model.csv';
        if (fs.existsSync(filename))
            fs.rmSync(filename)
        let row = "ID;PROVIDER;NAME;DESCRIPTION;LIMIT INPUT TOKEN;LIMIT OUTPUT TOKEN\n";
        record.map((e: UnifiedModelInfo) => {
            row += `${e.id};${e.provider};${e.displayName};${e.description}; ${e.inputTokenLimit}; ${e.outputTokenLimit}\n`;
        });
        fs.writeFile(filename, row, 'utf8', (err) => {
            if (err) {
                console.error('Errore:', err);
            } else {
                console.log('File scritto con successo');
            }
        })
    } catch (err: any) {
        console.error(`In fase di creazione del csv model, qualcosa è andato storto(${(err.message || err.text())})`)
    }
}
export const trace =async (trace: Promise<string>|string|null) => {
    try {
        let t = await trace
        if(!t) return;
        const now = new Date()
        const filename = `./files/trace${now.getDate()}${now.getMonth()+1}${now.getFullYear()}.txt`
        if (fs.existsSync(filename))
            fs.rmSync(filename)

        t = `[${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}] ${t}`

        fs.appendFile(filename, t, 'utf8', (err) => {
            if (err) {
                console.error('Errore:', err);
            }
        })


    } catch (err: any) {
        console.error(`In fase di creazione del csv model, qualcosa è andato storto(${(err.message || err.text())})`)
    }

}