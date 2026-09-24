import path from "path";
import Database from "better-sqlite3";
import {Scheduler} from "../scheduler/Scheduler.js";
import {Embindings} from "../scheduler/Embindings.js";
import {ClearDirectory} from "../scheduler/clearDirectory.js";

const directory = path.resolve(process.cwd(), 'src/database', 'rag.db');
const dbWorker = new Database(directory);


export default async function (action: 'CHUNK' | 'EMB') {
    try {
        if (!dbWorker) throw new Error("Database non connesso")
        if (action === 'CHUNK')
            await new Scheduler(dbWorker).start()
        else if (action === 'EMB')
            await new Embindings(dbWorker).start()
        return true;
    } catch (e: any) {
        console.log('Worker exception', e)
        throw e;
    }
}