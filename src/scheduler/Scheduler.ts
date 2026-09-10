import Database from "better-sqlite3";
import {SqlDb} from "../database/database.js";
import {Chunks} from "./chunks.js";

export class Scheduler {

    private db: Database.Database | undefined
    private statusIn: number[] | [] | undefined;
    private queue: any | null;

    constructor(db: Database.Database | undefined) {
        if (!db) return;
        this.db = db
        this.statusIn = [SqlDb._status(this.db), SqlDb._status(this.db, 'ko')]
        this.queue = this.search()
        setInterval(() => {
            console.log(`Scheduler check ...queue is :${(this.queue && Object.keys(this.queue).length > 0 ? 'FULL' : 'EMPTY')}`)
            if (this.queue) {
                queueMicrotask(() => Scheduler.worker(db, this.queue))
            }
        }, 30000)

    }


    private search() {
        try {
            let queue: any | null = null;
            if (this.statusIn && this.statusIn.length > 0 && this.db) {
                queue = this.db.prepare(`SELECT *
                                         FROM FILES
                                         WHERE STATUS_ID in (${this.statusIn.join(',')}) LIMIT 1`).get();
            }
            return queue;
        } catch (err: any) {
            console.log('Search files error', err)
            throw err;
        }
    }

    private static retry(db: Database.Database | undefined, id: number) {
        try {
            const max = 3;
            if (!db) throw new Error("Database not found")
            const check: any = db.prepare("SELECT count(*) as OK FROM FILES WHERE ID = ? AND RETRY_COUNT < ?").get([id, max])
            return check && parseInt(check.OK) === 1;

        } catch (err: any) {
            console.log('Retry failed ', err)
            throw err;
        }
    }

    private static update(db: Database.Database | undefined, id: number, error: boolean = false)
    {
        try {
            if (!db) throw new Error("Database not found")
            if (!error) {
                const processing = SqlDb._status(db, 'processing');
                db.prepare("UPDATE FILES SET RETRY_COUNT = (SELECT F.RETRY_COUNT+1 FROM FILES F WHERE F.ID = ? ), UPDATED_AT = datetime('now'), STATUS_ID = ?").run([
                    id, processing
                ])
            } else {
                const ko = SqlDb._status(db, 'ko');
                db.prepare("UPDATE FILES SET RETRY_COUNT = 0, UPDATED_AT = datetime('now'), STATUS_ID = ?").run([
                    id, ko
                ])
            }
        } catch (err: any) {
            console.log('Update Row failed ', err)
            throw err;
        }
    }

    public static async worker(db: Database.Database | undefined, data: any) {
        const retry = this.retry(db, data.ID);
        try {
            if (!db) throw new Error("Database not found")
            if (retry) {
                this.update(db, data.ID)
                if (['xlsx', 'xls', 'csv'].includes(data.EXT)) {
                    await Chunks.data_chunk(JSON.parse(data.CONTENT), data.ID)
                } else {
                    await Chunks.text_chunk(data.CONTENT, data.ID)
                }
                // todo lavorazione dei chunks
            }
        } catch (err: any) {
            if (retry) {
                console.log(`Microstak failed (${data.ID} retry ...`)
                queueMicrotask(() => Scheduler.worker(db,data))
            } else {
                console.log(`Microstak failed (${data.ID} closed queue`)
                this.update(db, data.ID, true)
                return;
            }
        }
    }
}