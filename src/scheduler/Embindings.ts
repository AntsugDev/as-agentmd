import Database from "better-sqlite3";
import dayjs from "dayjs";
import {Chunks} from "../database/mapping.js";
import {createVector} from "../utility/utility.js";
import {isActiveScheduler} from "./Scheduler.js";
import {log_worked, logger} from "../utility/storage.js";

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
        try {
            if (!isActiveScheduler && !isActiveEmbending) {
                const data: Chunks[] | undefined = this.search() ?? []
                log_worked('INFO', `Data length is ${data && data.length > 0 ? 'FULL' : 'EMPTY'}`, this.db, 'CHECK DATA SCHEDULER EMBEDDINGS')
                if (data.length > 0) {
                    let c = 1;
                    isActiveEmbending = true
                    log_worked('INFO', `Start working embed ...`, this.db)
                    for (let i = 0; i < data.length; i++) {
                        try {
                            log_worked('INFO', `To work row number ${i + 1} ...`, this.db, 'ROW NUMBER WORKING')
                            const task: Chunks = data[i]
                            await Embindings.worker(this.db, task)
                            c++;
                        } catch (e: any) {
                            throw e;
                        }
                    }
                    log_worked('INFO', `... terminate working embed`, this.db)
                    if (c >= data.length) isActiveEmbending = false
                }
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

    protected static async insert(db: Database.Database | undefined, chunk_id: number, file_id: number, content: any) {
        try {
            if (!db) throw new Error("Database not found")
            db.exec('BEGIN TRANSACTION')
            const create: any | null = db.prepare("INSERT OR REPLACE INTO vss_chunks (chunk_id,file_id, embedding) VALUES (?,?,?);")
                .run([BigInt(chunk_id), BigInt(file_id), JSON.stringify(content)]).lastInsertRowid
            log_worked('INFO',`Insert last id: ${create}`,db,'INSERT ID VECTOR')
            if (create) {
                const u = this.update(db, chunk_id, 1)
                db.exec('COMMIT')
                return u;
            } else throw new Error("Non sono riusciuto ad inserire il vettore in tabella")
        } catch (err: any) {
            if (!db) throw new Error("Database not found")
            db.exec('ROLLBACK')
            throw err;
        }
    }

    public static async worker(db: Database.Database | undefined, data: Chunks) {
        try {
            if (!db) throw new Error("Database not found")
            const vector: number[] = await createVector(data.CONTENT)
            log_worked('INFO',`Vector length ${vector.length}`,db,'VECTOR LENGTH')
            if (vector.length > 0)
                return await this.insert(db, data.ID, data.FILE_ID, vector)
            else throw new Error("Vettore non creato o di lunghezza pari a zero")
        } catch (err: any) {
            log_worked('EXCEPTION', `Scheduler embed exception:${err.message || err.toString()}`, db)
            this.update(db, data.ID, 2)
            throw err;
        }
    }

}