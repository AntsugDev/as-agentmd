import Database from "better-sqlite3";
import {Chunks} from "../database/mapping.js";
import {cArray, createVector} from "../utility/utility.js";
import {isActiveScheduler} from "./Scheduler.js";
import {log_worked} from "../utility/storage.js";
import {activeScheduler} from "./ActiveScheduler.js";

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
        try {
            if (!activeScheduler(this.db,false)) {
                log_worked('INFO', `Start working embed ...`, this.db);
                const data: Chunks[] = this.search() ?? [];
                if (data.length === 0) {
                    return;
                }
                activeScheduler(this.db,true,1)
                log_worked('INFO', `Processing block of ${data.length} chunks`, this.db, 'CHECK LOOP BLOCK EMBED');
                //@ts-ignore
                let loop = 0;
                for (let i = 0; i < data.length; i++) {
                    const task: Chunks = data[i]
                    const r = await Embindings.worker(this.db, task);
                    if (r) loop++
                }
                if (loop >= data.length)
                    activeScheduler(this.db,true,0)

                log_worked('INFO', `... terminate working embed`, this.db);
            }
        } catch (e: any) {
            if (isActiveEmbending)
                isActiveEmbending = false;
            log_worked('EXCEPTION', `Start embed fatal error: ${e.message || e.toString()}`, this.db);
            throw e;
        }
    }

    private search(): Chunks[] | undefined {
        try {
            //@ts-ignore
            const embeddings: Chunks[] | undefined = this.db?.prepare("select * from CHUNKS c where not exists(select 1 from vss_chunks v where v.CHUNK_ID = c.id) and c.STATUS in (0,2) limit 100;").all()
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
            db.prepare("UPDATE CHUNKS SET UPDATED_AT = datetime('now'), STATUS = ? WHERE ID = ?").run([
                terminate, id
            ])
            return true;
        } catch (err: any) {
            throw err;
        }
    }

    protected static async insert(db: Database.Database | undefined, chunk_id: number, file_id: number, content: any) {
        try {
            if (!db) throw new Error("Database not found")
            const run = db.transaction((chunk_id: number, file_id: number, content: any) => {
                const create: any | null = db.prepare("INSERT OR REPLACE INTO vss_chunks (chunk_id,file_id, embedding) VALUES (?,?,?);")
                    .run([BigInt(chunk_id), BigInt(file_id), JSON.stringify(content)]).lastInsertRowid
                if (create) {
                    return this.update(db, chunk_id, 1)
                } else throw new Error("Cannot created embed")
            });
            return run(chunk_id, file_id, content)
        } catch (err: any) {
            if (!db) throw new Error("Database not found")
            this.update(db, chunk_id, 2)
            throw err;
        }
    }

    public static async worker(db: Database.Database | undefined, row: any | Chunks) {
        try {
            if (!db) throw new Error("Database not found")
            const vector: number[] = await createVector(row.CONTENT) ?? []
            log_worked('INFO', `Vector length ${vector.length}`, db, 'VECTOR LENGTH')
            if (vector.length === 0) return this.update(db, row.ID, 2)
            return await this.insert(db, row.ID, row.FILE_ID, vector)
        } catch (err: any) {
            log_worked('EXCEPTION', `Scheduler embed exception:${err.message || err.toString()}`, db)
            return true;
        }
    }

}