import { Worker } from 'worker_threads';
import dayjs from "dayjs";
import path from "path";
export const work = async (action:'CHUNK'|'EMB') => {
    return new Promise((resolve, reject) => {
        try {
//todo in futuro (produzione) cambiare con il file js e togliere execArgv
            const worker = new Worker('./src/worked/index.ts',{
                workerData:action,
                name:`${dayjs().format('YYYYMMDDHHmm')}_worker_${action}`,
                execArgv: ['-r', 'ts-node/register']
            });

            worker.on('message', (result:any) => {
                if (result.success) {
                    resolve(result.data || result.message);
                } else {
                    reject(new Error(result.error));
                }
            })

            worker.on('error', (e:any) => {
                reject(e)
            })
            worker.on('exit', (exitCode:number) => {
                if (exitCode !== 0) {
                    reject(new Error(`Worker terminato con codice anomalo ${exitCode}`));
                }
            })


        } catch (e: any) {
            reject(e)
        }
    })
}