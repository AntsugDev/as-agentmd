import Database from "better-sqlite3";
import {db} from "../database/database.js";
import {createVector} from "./utility.js";
import {RagInt} from "../database/mapping.js";

const preQuery = "SELECT COUNT(*) AS TOTAL FROM FILES WHERE TAG = ? AND EXT in ('xlsx', 'xls', 'csv')"

const queryRag = "SELECT C.CONTENT FROM vss_chunks V JOIN CHUNKS C ON C.ID = V.CHUNK_ID JOIN FILES F ON F.ID = C.FILE_ID WHERE  v.embedding MATCH ? AND  F.TAG = ?  AND k = ?;"

export class Rag {

    private message: string;
    private db: Database.Database | undefined;
    private tag: string;

    constructor(message: string, tag: string) {
        this.message = message
        this.db = db
        this.tag = tag
    }
    protected  pre(){
        try{
            const ext:any = this.db?.prepare(preQuery).get([this.tag])
            if(ext && ext.TOTAL > 0){
                return true;
            }
            return false;
        }catch (e:any){
            throw e;
        }
    }

    public async result() {
        try {
            let limit:number = 3;
            if(this.pre()) limit = 100;
            const vector = await createVector(this.message)
            let r: string = "";
            if (vector.length > 0) {
                const floatArray = new Float32Array(vector);
                const vectorBuffer = Buffer.from(floatArray.buffer);
                const result = this.db?.prepare(queryRag).all([vectorBuffer, this.tag,limit]);
                // @ts-ignore
                result?.map((e: RagInt) => {
                    let content: string = e.CONTENT
                    r += `${content}`
                })
            }
            return (r.length > 0 ? r.toString().replaceAll("\r\n", "") : null);
        } catch (err: any) {
            throw err;
        }
    }

}