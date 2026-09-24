import {parentPort, workerData} from "node:worker_threads";
import {Scheduler} from "../scheduler/Scheduler.js";
import {db} from "../index.js";
import {Embindings} from "../scheduler/Embindings.js";

const action = workerData

export const executeWoeker = async () => {
    try {
        if (action === 'CHUNK') {
            new Scheduler(db)
        } else if (action === 'EMB') {
            new Embindings(db)
        } else {
            throw new Error(`Azione sconosciuta: ${action}`);
        }
        parentPort?.postMessage({
            success: true
        })

    } catch (e: any) {
        parentPort?.postMessage({
            success: false, error: e.message
        })
    }
}
await executeWoeker();