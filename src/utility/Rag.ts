import Database from "better-sqlite3";
import {db} from "../database/database.js";
import {createVector} from "./utility.js";
import {RagInt} from "../database/mapping.js";

const preQuery = "SELECT COUNT(*) AS TOTAL FROM FILES WHERE TAG = ? AND EXT in ('xlsx', 'xls', 'csv')"

const queryRag = "SELECT C.CONTENT, V.distance FROM vss_chunks V JOIN CHUNKS C ON C.ID = V.chunk_id WHERE V.embedding MATCH ?  AND k = ?  AND V.chunk_id IN (SELECT C2.ID  FROM CHUNKS C2 JOIN FILES F ON F.ID = C2.FILE_ID  WHERE F.TAG = ? ) ORDER BY V.distance;"

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
            let limit:number = 5;
            if(this.pre()) limit = 100;
            const vector = await createVector(this.message)
            console.log('vettore=> ', vector)
            let r: string = "";
            if (vector.length > 0) {
                const floatArray = new Float32Array(vector[0]);
                const vectorBuffer = Buffer.from(floatArray.buffer);
                const result = this.db?.prepare(queryRag).all([vectorBuffer,limit, this.tag]);
                console.log('result vector ', result)
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