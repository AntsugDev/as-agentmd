import Database from "better-sqlite3";
import {SqlDb} from "../database/database.js";
import {Chunks} from "./chunks.js";
import dayjs from "dayjs";
import {Files} from "../database/mapping.js";
import {isActiveEmbending} from "./Embindings.js";

export let isActiveScheduler: boolean = false;
let clear: any | null = null;

export class Scheduler {

    private db: Database.Database | undefined
    private statusIn: number[] | [] | undefined;
    private queue: any | null;

    constructor(db: Database.Database | undefined) {
        if (!db) return;
        this.db = db
        this.statusIn = [SqlDb._status(this.db), SqlDb._status(this.db, 'ko')]
        this.init(this.db)

    }

    private start(db: Database.Database | undefined, delay:number = 300000) {
        console.log(`[SCHED] Embedding attivo?${isActiveEmbending ? 'SI':'NO'} - Scheduler attivo?${isActiveScheduler ? 'SI':'NO'}`)

        const clearTmp = setTimeout(() => {
            if (isActiveScheduler || isActiveEmbending) {
                console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Scheduler chunks is blocked. Starts in  ${dayjs().add(60, 'seconds').format('YYYY-MM-DD HH:mm:ss')} `)
                this.start(db, 60000)
                return;
            }
            if (clear) {
                clearTimeout(clear)
                clear = null;
            }
            const now = dayjs();
            this.search()
            console.log(`[${now.format('YYYY-MM-DD HH:mm:ss')}] Scheduler chunks is worked (${(this.queue && Object.keys(this.queue).length > 0 ? 'FULL' : `EMPTY`)}).Next between ${now.add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss')} `)
            if (this.queue) {
                queueMicrotask(() => {
                    isActiveScheduler = true;
                    clear = clearTmp
                    Scheduler.worker(db, this.queue)
                    this.start(db, delay)
                })
            }else{
                if (clear) {
                    clearTimeout(clear)
                    clear = null;
                }
                isActiveScheduler = false
            }
        }, delay)
    }

    private init(db: Database.Database | undefined) {
        try {
            if (!db) throw new Error("Database not found")
            this.search()
            const nowInit = dayjs();
            console.log(`[${nowInit.format('YYYY-MM-DD HH:mm:ss')}] Scheduler chunks is worked (${(this.queue && Object.keys(this.queue).length > 0 ? 'FULL' : `EMPTY`)}). Next between ${nowInit.add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss')} `)
            this.start(db)
        } catch (err: any) {
            throw err;
        }
    }

    private search() {
        try {
            if (this.statusIn && this.statusIn.length > 0 && this.db) {
                this.queue = this.db.prepare(`SELECT *
                                              FROM FILES
                                              WHERE STATUS_ID in (${this.statusIn.join(',')}) LIMIT 1`).get();
            }
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

    private static update(db: Database.Database | undefined, id: number, error: boolean = false, status: 'processing' | 'ok' | 'ko' = 'processing') {
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
            console.log('Update Row failed ', err)
            throw err;
        }
        finally {
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
                    res = await Chunks.data_chunk(JSON.parse(data.CONTENT), data.ID)
                } else {
                    res = await Chunks.text_chunk(data.CONTENT, data.ID)
                }
                if (res) this.update(db, data.ID, false, 'ok')
            }
        } catch (err: any) {
            console.log('----------------------CHUNKS-------------------------------')
            console.log(err)
            console.log('--------------------------------------------------------')
            if (retry) {
                setTimeout(() => {
                    console.log(`Task scheduler failed, next try from ${now.add(30, 'seconds').format('YYYY-MM-DD HH:mm:ss')} (${err.toString()})`)
                    queueMicrotask(async () => await Scheduler.worker(db, data))
                }, 3000)
            } else {
                console.log(`Task scheduler failed, terminate with this error: ${err.toString()}`)
                this.update(db, data.ID, true)
                return;
            }
        }
    }
}