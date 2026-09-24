import Database from "better-sqlite3";
import {SqlDb} from "../database/database.js";
import {Chunks} from "./chunks.js";
import dayjs from "dayjs";
import {isActiveEmbending} from "./Embindings.js";
import {dd} from "../utility/utility.js";
import {log_worked, logger} from "../utility/storage.js";

export let isActiveScheduler: boolean = false;
let clear: any | null = null;

interface Files {
    ID: number
    FILE_NAME: string
    CONTENT: string
    TAG: string,
    STATUS_ID: number
    MODEL_USED?: string | null
    CREATED_AT: string
    UPDATED_AT: string | null
    RETRY_COUNT: number | null
    MIME_TYPE: string
    EXT: string
}

export class Scheduler {

    private db: Database.Database | undefined
    private statusIn: number[] | [] | undefined;
    private queue: any | null;

    constructor(db: Database.Database | undefined) {
        if (!db) throw new Error("Database not found");
        this.db = db
        this.statusIn = [SqlDb._status(this.db), SqlDb._status(this.db, 'ko')]
    }

    public async start() {
        let msg = "";
        const now = dayjs();
        try {
            msg += `\n[SCHED] Embedding attivo? ${isActiveEmbending ? 'SI' : 'NO'} - Scheduler attivo? ${isActiveScheduler ? 'SI' : 'NO'}`;
            if (!isActiveScheduler && !isActiveEmbending) {
                const data: Files | undefined = this.search()
                msg += ` \nScheduler chunks is worked (${(data && Object.keys(data).length > 0 ? 'FULL' : `EMPTY`)}) `
                if (data) {
                    isActiveScheduler = true;
                    await Scheduler.worker(this.db, data)
                }
            }
            await log_worked('INFO', msg)
        } catch (e: any) {
            throw e;
        }
    }

    private search(): Files | undefined {
        try {
            if (this.statusIn && this.statusIn.length > 0 && this.db) {
                // @ts-ignore
                const result: Files | undefined = this.db.prepare(`SELECT *
                                                                   FROM FILES
                                                                   WHERE STATUS_ID in (${this.statusIn.join(',')}) LIMIT 1`).get();
                return result;
            }
        } catch (err: any) {
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
            throw err;
        }
    }

    public static update(db: Database.Database | undefined, id: number, error: boolean = false, status: 'processing' | 'ok' | 'ko' = 'processing') {
        try {
            if (!db) throw new Error("Database not found")
            if (!error) {
                const processing = SqlDb._status(db, status);
                db.prepare("UPDATE FILES SET RETRY_COUNT = (SELECT F.RETRY_COUNT+1 FROM FILES F WHERE F.ID = ? ), UPDATED_AT = datetime('now'), STATUS_ID = ? WHERE ID = ? ").run([
                    id, processing, id
                ])
                if (status === 'ok')
                    isActiveScheduler = false;
            } else {
                const ko = SqlDb._status(db, 'ko');
                db.prepare("UPDATE FILES SET RETRY_COUNT = 0, UPDATED_AT = datetime('now'), STATUS_ID = ? WHERE ID = ?").run([
                    id, ko, id
                ])
                isActiveScheduler = false;
            }
        } catch (err: any) {
            throw err;
        } finally {
            if (status === 'ok' || status === 'ko')
                isActiveScheduler = false;
        }
    }

    public static async worker(db: Database.Database | undefined, data: Files) {
        const retry = this.retry(db, data.ID);
        const now = dayjs()
        try {
            if (!db) throw new Error("Database not found")
            if (retry) {
                this.update(db, data.ID)
                let res: boolean = false;
                if (['xlsx', 'xls', 'csv'].includes(data.EXT)) {
                    res = await Chunks.data_chunk(JSON.parse(data.CONTENT), data.ID, db)
                } else {
                    res = await Chunks.text_chunk(data.CONTENT, data.ID, db)
                }
                if (res) this.update(db, data.ID, false, 'ok')
            }
        } catch (err: any) {
            let msg = "";
            if (retry) {
                setTimeout(async () => {
                    msg = `Task scheduler failed, next try from ${now.add(30, 'seconds').format('YYYY-MM-DD HH:mm:ss')} (${err.toString()})`
                    await logger('EXCEPTION', 'WORKED', msg, 701, err, 'worked')
                    await Scheduler.worker(db, data)
                }, 3000)
            } else {
                msg = `Task scheduler failed, terminate with this error: ${err.toString()}`
                await logger('EXCEPTION', 'WORKED', msg, 700, err, 'worked')
                this.update(db, data.ID, true)
                return;
            }
        }
    }
}