import Database from "better-sqlite3";

export class Embindings {

    private db: Database.Database | undefined
    private embeddings: any | null = null;
    private polling: any | null;

    constructor(db: Database.Database | undefined) {
        this.db = db
        this.search()
        if (this.embeddings) {
            for (let i = 0; i < this.embeddings.length; i++) {
                const task = this.embeddings[i]
                if (this.polling) {
                    clearTimeout(this.polling)
                    this.polling = null;
                }
                this.polling = setTimeout(() => queueMicrotask(() => Embindings.worker(this.db, task)), 10000)
            }

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
            db.prepare("UPDATE CHUNKS SET RETRY_COUNT = (SELECT F.RETRY_COUNT+1 FROM CHUNKS F WHERE F.ID = ? ), UPDATED_AT = datetime('now'), STATUS_ID = ?").run([
                id, terminate
            ])
        } catch (err: any) {
            throw err;
        }
    }

    public static async worker(db: Database.Database | undefined, data: any) {
        const retry = this.retry(db, data.ID)
        try {
            if (!db) throw new Error("Database not found")
            if (retry) {
                const model = this.models(db, data.FILE_ID)
            }
        } catch (err: any) {
            if (retry) {
                console.log(`Microstak(Emb) failed (${data.ID} retry ...`)
                queueMicrotask(() => Embindings.worker(db, data))
            } else {
                console.log(`Microstak(emb) failed (${data.ID} closed queue`)
                this.update(db, data.ID, 2)
                return;
            }
        }

    }

}