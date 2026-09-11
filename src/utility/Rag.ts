import Database from "better-sqlite3";
import {db} from "../index.js";
import {createVector} from "./utility.js";
import {RagInt} from "../database/mapping.js";

const queryRag = "SELECT C.CONTENT, vec_distance_cosine(v.embedding, ?) AS distance FROM vss_chunks V JOIN CHUNKS C ON C.ID = V.CHUNK_ID JOIN FILES F ON F.ID = C.FILE_ID WHERE F.TAG = ? ORDER BY distance LIMIT 3; "

export class Rag {

    private message: string;
    private db: Database.Database | undefined;
    private tag: string;

    constructor(message: string, tag: string) {
        this.message = message
        this.db = db
        this.tag = tag
    }

    public async result() {
        try {
            const vector = await createVector(this.message)
            let r: string = "";
            if (vector) {
                const floatArray = new Float32Array(vector);
                const vectorBuffer = Buffer.from(floatArray.buffer);
                const result = this.db?.prepare(queryRag).all([vectorBuffer, this.tag]);
                // @ts-ignore
                result?.map((e: RagInt) => {
                    let content: string = e.CONTENT
                    r += `${content} `
                })
            }
            return (r.length > 0 ? r.toString().replaceAll("\r\n", "") : null);
        } catch (err: any) {
            throw err;
        }
    }

}