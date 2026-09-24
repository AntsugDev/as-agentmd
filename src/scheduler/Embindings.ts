import Database from "better-sqlite3";
import dayjs from "dayjs";
import {Chunks} from "../database/mapping.js";
import {createVector} from "../utility/utility.js";
import {isActiveScheduler} from "./Scheduler.js";

export let isActiveEmbending = false;
let clear:any|null = null;

export class Embindings {

    private db: Database.Database | undefined
    private embeddings: any | null = null;
    private polling: any | null;

    constructor(db: Database.Database | undefined) {
        this.db = db
        this.init(this.db)

    }

    protected start(delay:number = 360000){
        try{
            console.log(`[SCHED EMB] Embedding attivo?${isActiveEmbending ? 'SI':'NO'} - Scheduler attivo?${isActiveScheduler ? 'SI':'NO'}`)
            const tmp = setTimeout(() => {
                if(isActiveEmbending || isActiveScheduler){
                    console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Scheduler embeddings is blocked. Starts in  ${dayjs().add(80, 'seconds').format('YYYY-MM-DD HH:mm:ss')} `)
                    this.start(80000)
                    return
                }
                if(clear){
                    clearTimeout(clear)
                    clear = null;
                }
                this.search()
                console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Scheduler embeddings work, find nr. row ${(this.embeddings.length)}.Next between ${dayjs().add(6, 'minutes').format('YYYY-MM-DD HH:mm:ss')} `)
                if (this.embeddings) {
                    let c = 1;
                    for (let i = 0; i < this.embeddings.length; i++) {
                        isActiveEmbending = true
                        const task = this.embeddings[i]
                        c++;
                        queueMicrotask(() => {
                            clear = tmp;
                            Embindings.worker(this.db, task)

                        })
                    }
                    console.log(`Ciclo giunto al numero ${c}`)
                    console.log(`Lunghezza embeddings data ${this.embeddings.length}`)
                    if(c >= this.embeddings.length) isActiveEmbending = false
                }
            }, delay)

        }catch (e:any){
            throw e;
        }
    }

    private init(db: Database.Database | undefined) {
        try {
            if (!db) throw new Error("Database not found")
            this.search()
            console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] Scheduler embeddings work, find nr. row ${(this.embeddings.length)}.Next between ${dayjs().add(6, 'minutes').format('YYYY-MM-DD HH:mm:ss')}`)
            this.start()

        } catch (err: any) {
            throw err;
        }
    }

    private static models(db: Database.Database | undefined, idFile: number) {
        try {
            if (!db) throw new Error("Database not found")
            const m: any = db?.prepare("SELECT MODEL_USED FROM FILES WHERE ID = ?").get([idFile])
            if (m) {
                return m.MODEL_USED
            }
            return null;
        } catch (err: any) {
            throw err;
        }
    }

    private search() {
        try {
            this.embeddings = this.db?.prepare("SELECT * FROM CHUNKS WHERE STATUS in (0,2)").all()
        } catch (err: any) {
            console.log("Eccezione ricerca chuncks per embindings", err)
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
                db.exec('COMMIT')
                return this.update(db, chunk_id, 1)
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
                const vector = await createVector(data.CONTENT)
                if (vector)
                    return this.insert(db, data.ID, data.FILE_ID, vector)
                else {
                    setTimeout(() => {
                        this.update(db, data.ID, 0)
                        queueMicrotask(async () => Embindings.worker(db, data))
                    }, 5000)
                }
            }
        } catch (err: any) {
            console.log('----------------------EMB-------------------------------')
            console.log(err)
            console.log('--------------------------------------------------------')
            if (retry) {
                setTimeout(() => {
                    console.log(`Task scheduler emb failed, next try from ${now.add(30, 'seconds').format('YYYY-MM-DD HH:mm:ss')} (${err.toString()})`)
                    this.update(db, data.ID, 0)
                    queueMicrotask(async () => await Embindings.worker(db, data))
                }, 30000)
            } else {
                console.log(`Task scheduler emb failed, terminate with this error: ${err.toString()}`)
                this.update(db, data.ID, 2)
                return;
            }
        }

    }

}