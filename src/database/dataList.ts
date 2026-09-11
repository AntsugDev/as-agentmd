import Database from "better-sqlite3";
import {db} from "../index.js";
import {ListData} from "./mapping.js";

export class DataList {
    private query: string;
    private amm: string;
    private db: Database.Database | undefined

    constructor() {
        this.query = "SELECT * FROM DATALIST"
        this.amm = "SELECT * FROM DATALIST_AMM"
        this.db = db
    }

    public table() {
        try {
            const list: ListData[] = []
            if (!this.db) throw new Error("Database not found")
            this.db.prepare(this.query).all().map((e: any) => list.push(e))
            return list;

        } catch (err: any) {
            throw err;
        }
    }
    public amministrazione() {
        try {
            if (!this.db) throw new Error("Database not found")
            return this.db.prepare(this.amm).all()
        } catch (err: any) {
            throw err;
        }
    }

}