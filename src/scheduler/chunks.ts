import {SqlDb} from "../database/database.js";
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {getEncoding} from "js-tiktoken";
import {cArray, dd} from "../utility/utility.js";
import {log_worked, logger} from "../utility/storage.js";
import dayjs from "dayjs";
import Database from "better-sqlite3";
import {Scheduler} from "./Scheduler.js";

export const enc = getEncoding("cl100k_base");

export class Chunks {

    private static getToken(text: string): number {
        try {
            const tokens: number[] = enc.encode(text)
            return tokens.length;
        } catch (err: any) {
            console.log('Eccezione creazione getToken', err)
            throw err;
        }
    }


    public static async text_chunk(data: any, id: number,db:Database.Database|undefined) {

        try {
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 800,
                chunkOverlap: 150,
                separators: ["#", "\n## ", "\n### ", "\n\n", "\n", " "],
            });
            const keys = ['FILE_ID', 'CONTENT', 'TOKENS'];
            const outputChunks = await splitter.createDocuments([data]);
            db?.transaction(() => {
                outputChunks.map(e => {
                    const text = e.pageContent
                    const values = [id, text, this.getToken(text)];
                    SqlDb.insert(db, 'CHUNKS', keys, values)
                })
            })
            return true;

        } catch (err: any) {
            console.log('Eccezione creazione chunks file di testo', err)
            throw err;
        }
    }

    public static async data_chunk(data: any[], id: number,db:Database.Database|undefined) {
        let msg = "";
        try {
            msg +="\nStart Data chunck"
            const headers = data[0]
            const keys = ['FILE_ID', 'CONTENT', 'TOKENS'];
            data.shift()
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const text = headers.map((h: string, index: number) => `${h.toString().trim()}=${(row[index] || "")}`).join(';')
                const values = [id, text, this.getToken(text)];
                if(db)
                SqlDb.insert(db, 'CHUNKS', keys, values)
            }
            msg += `\nTerminate data chunk`
            await log_worked('INFO',msg)
            return true;
        } catch (err: any) {
            Scheduler.update(db,id,true)
            await log_worked('EXCEPTION',`Exception work chunks ${err.message}`)
            throw err;
        }finally {
            if(msg !== "")
                logger('INFO', 'WORKED', msg, null, null,`${dayjs().format('YYYYMMDD')}_worked`)
        }
    }


}