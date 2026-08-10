import fs from 'fs';

const dirPath = 'files';
const createDirectory = async () => {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, {recursive: true});
    } catch (e) {
        throw new Error("Impossibile creare la directory files")
    }
}

export const csv = (record: any[]) => {
    try {
        createDirectory();
        const filename = './files/model.csv';
        if (fs.existsSync(filename))
            fs.rmSync(filename)
        let row = "ID;PROVIDER;NAME;DESCRIPTION;LIMIT INPUT TOKEN;LIMIT OUTPUT TOKEN\n";
        record.map((e: any) => {
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
export const trace = (trace: string | null, status: boolean = true) => {
    try {
        let t = trace
        if (!t) return;
        const now = new Date()
        const dateFile: string = `${now.getDate().toString().padStart(2, '0')}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`
        const filename = `./files/trace_${dateFile}.txt`
        const time: string = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        t = `${fs.existsSync(filename) ? "\n" : ''}${(status ? 'USER' : 'AGENT')}\t-\t[${time}]\t${t}`
        fs.appendFile(filename, t, 'utf8', (err) => {
            if (err) {
                console.error('Errore:', err);
            }
        })
    } catch (err: any) {
        console.log(err)
        console.error(`In fase di creazione del file trace, qualcosa è andato storto(${(err.message || err.text())})`)
    }
}