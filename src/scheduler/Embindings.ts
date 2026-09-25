import Database from "better-sqlite3";
import dayjs from "dayjs";
import {Chunks} from "../database/mapping.js";
import {createVector} from "../utility/utility.js";
import {isActiveScheduler} from "./Scheduler.js";
import {log_worked, logger} from "../utility/storage.js";
import {awaitAllCallbacks} from "@langchain/core/callbacks/promises";

export let isActiveEmbending = false;
let clear: any | null = null;

interface IntEmb {
    ID: number
    FILE_ID: number
    CONTENT: string
    TOKENS: number | null
    STATUS: number
    RETRY_COUNT: number | null
    CREATED_AT: string
    UPDATED_AT: string | null
}

export class Embindings {

    private db: Database.Database | undefined
    private embeddings: any | null = null;
    private polling: any | null;

    constructor(db: Database.Database | undefined) {
        this.db = db
    }

    public async start() {
        let msg = "";
        const now = dayjs();
        try {
            msg += `\n[SCHED EMB] Embedding attivo? ${isActiveEmbending ? 'SI' : 'NO'} - Scheduler attivo? ${isActiveScheduler ? 'SI' : 'NO'}`;
            if (!isActiveScheduler && !isActiveEmbending) {
                const data: Chunks[] | undefined = this.search() ?? []
                msg += ` \nScheduler emb is worked (${(data && data.length > 0 ? 'FULL' : `EMPTY`)}) `
                if (data.length > 0) {
                    let c = 1;
                    for (let i = 0; i < data.length; i++) {
                        isActiveEmbending = true
                        const task:Chunks = data[i]
                        c++;
                        await Embindings.worker(this.db, task)
                    }
                    if (c >= data.length) isActiveEmbending = false
                }
                await log_worked('INFO', msg)
            }

        } catch (e: any) {
            throw e;
        }
    }


    private search(): Chunks[] | undefined {
        try {
            //@ts-ignore
            const embeddings: Chunks[] | undefined = this.db?.prepare("SELECT * FROM CHUNKS WHERE STATUS in (0,2)").all()
            return embeddings;
        } catch (err: any) {
            throw err;
        }
    }

    private static retry(db: Database.Database | undefined, id: number) {
        try {
            if (!db) throw new Error("Database not found")
            const check: any = db.prepare("SELECT count(*) as OK FROM CHUNKS WHERE ID = ? AND RETRY_COUNT < ?").get([id, 3])
            return check && parseInt(check.OK) === 1;
        } catch (err: any) {
            throw err;
        }
    }

    private static update(db: Database.Database | undefined, id: number, terminate: number = 0) {
        try {
            if (!db) throw new Error("Database not found")
            db.prepare("UPDATE CHUNKS SET RETRY_COUNT = (SELECT F.RETRY_COUNT+1 FROM CHUNKS F WHERE F.ID = ? ), UPDATED_AT = datetime('now'), STATUS = ?").run([
                id, terminate
            ])
            return true;
        } catch (err: any) {
            throw err;
        }
    }

    protected static insert(db: Database.Database | undefined, chunk_id: number, file_id: number, content: any) {
        try {
            if (!db) throw new Error("Database not found")
            db.exec('BEGIN TRANSACTION')
            const create: any | null = db.prepare("INSERT OR REPLACE INTO vss_chunks (chunk_id,file_id, embedding) VALUES (?,?,?);")
                .run([BigInt(chunk_id), BigInt(file_id), JSON.stringify(content)]).lastInsertRowid
            if (create) {
                const u =  this.update(db, chunk_id, 1)
                db.exec('COMMIT')
                return u;
            }
        } catch (err: any) {
            if (!db) throw new Error("Database not found")
            db.exec('ROLLBACK')
            throw err;
        }
    }

    public static async worker(db: Database.Database | undefined, data: Chunks) {
        const retry = this.retry(db, data.ID)
        const now = dayjs()
        try {
            if (!db) throw new Error("Database not found")
            if (retry) {
                const vector:number[] = await createVector(data.CONTENT)
                if (vector.length > 0)
                    return this.insert(db, data.ID, data.FILE_ID, vector)
                else {
                    setTimeout(async () => {
                        this.update(db, data.ID, 0)
                        await Embindings.worker(db, data)
                    }, 5000)
                }
            }
        } catch (err: any) {
            if (retry) {
                setTimeout(async () => {
                    let msg = `Task scheduler emb failed, next try from ${now.add(30, 'seconds').format('YYYY-MM-DD HH:mm:ss')} (${err.toString()})`
                    await log_worked('EXCEPTION',  msg)
                    this.update(db, data.ID, 0)
                     await Embindings.worker(db, data)
                }, 30000)
            } else {
                let msg = `Task scheduler emb failed, terminate with this error: ${err.toString()}`
                await log_worked('EXCEPTION',  msg)
                this.update(db, data.ID, 2)
                return;
            }
        }

    }

}