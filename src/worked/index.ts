import path from "path";
import Database from "better-sqlite3";
import {Scheduler} from "../scheduler/Scheduler.js";
import {Embindings} from "../scheduler/Embindings.js";

const directory = path.resolve(process.cwd(), 'src/database', 'rag.db');
const dbWorker = new Database(directory);


export default function (action: 'CHUNK' | 'EMB') {
    try {
       if (!dbWorker) throw new Error("Database non connesso")
        if (action === 'CHUNK') new Scheduler(dbWorker)
        else new Embindings(dbWorker)

    } catch (e: any) {
        console.log('Worker exception', e)
        return false
    }
}