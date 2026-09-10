import Database from 'better-sqlite3';
import * as sqliteVec from 'sqlite-vec';
import fs from "fs/promises";
import path from "path";
import {Scheduler} from "../scheduler/Scheduler.js";
import {Embindings} from "../scheduler/Embindings.js";

export class SqlDb {

    private _db: Database.Database | undefined;

    constructor() {
        if (this._db) return;
        const directory = path.join('src/database', `rag.db`)
        this._db = new Database(directory);
        sqliteVec.load(this._db);
    }

    public version() {
        try {
            if (!this._db) throw new Error("Database not found");
            const version = this._db.prepare('select vec_version()').pluck().get() as string;
            console.log(`SQLite caricato con successo. sqlite-vec version: ${version}`);
        } catch (err: any) {
            console.log('Eccezione versione db', err)
        }
    }

    public async create() {
        try {
            if (!this._db) throw new Error("Database not found");
            const directory = path.join('src/database', `table.sql`)
            const createTable = await fs.readFile(directory, 'utf-8')
            if (createTable && this._db) {
                this._db.exec(createTable)
                setTimeout(() => {
                    this.init()
                    new Scheduler(this._db)
                    new Embindings(this._db)
                }, 3000)
            }
            return this._db;

        } catch (err: any) {
            console.log('Eccezione creazione db', err)
        }
    }

    private async init() {
        const status: string[] = [
            'pending', 'ok', 'ko', 'processing'
        ]
        try {
            Array.from(status).forEach(e => {
                const i: any = this._db?.prepare(`INSERT INTO STATUS (name)
                                                  VALUES (?)`).run(e).lastInsertRowid
            })
        } catch (err: any) {
            console.log('Init eccezione', err)
        }
    }

    public static insert(db: Database.Database | undefined, table: string, keys: string[], values: any[]) {
        try {
            if (!db) throw new Error("Database non definito")
            const v: string[] = [];
            Array.from(keys).forEach(e => {
                v.push('?')
            })

            const ins = `INSERT INTO ${table} (${keys.join(', ')})
                         values (${v.join(',')})`;
            let r: any|null = null
            const tmp = db.prepare(ins).run(values).lastInsertRowid
            if (tmp) {
                r = db.prepare("SELECT * FROM FILES WHERE ID = ?").get(tmp)
            }
            return r;
        } catch (err: any) {
            console.log('Insert eccezione', err)
            throw err;
        }
    }

    public static _status(db: Database.Database | undefined, status: 'pending' | 'processing' | 'ok' | 'ko' = 'pending') {
        try {
            if (!db) throw new Error("Database non definito")
            const data: any = db.prepare("SELECT ID FROM STATUS WHERE NAME = ?").get(status)
            if (data && data?.ID) {
                return data.ID
            } else throw new Error("Pending status not found")
        } catch (err: any) {
            console.log('Insert eccezione', err)
            throw err;
        }
    }
}

