import {SqlDb} from "../database/database.js";
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {getEncoding} from "js-tiktoken";
import {log_worked, logger} from "../utility/storage.js";
import dayjs from "dayjs";
import Database from "better-sqlite3";
import {Scheduler} from "./Scheduler.js";
import {cArray} from "../utility/utility.js";

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


    public static async text_chunk(data: any, id: number, db: Database.Database | undefined) {

        try {
            log_worked('INFO', `Start work chunks text ...`, db)
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
            log_worked('INFO', `... terminate work chunks text`, db)
            return true;
        } catch (err: any) {
            Scheduler.update(db, id, true)
            throw err;
        }
    }

    public static async data_chunk(data: any[], id: number, db: Database.Database | undefined) {
        let msg = "";
        try {
            log_worked('INFO', `Start work chunks excel ...`, db)
            const headers = data[0]
            const keys = ['FILE_ID', 'CONTENT', 'TOKENS'];
            data.shift()
            let isDivider = false
            let firstChunks = data
            let len = data.length
            log_worked('INFO',`Len data ${len}. ${len > 1000 ? 'Divider data' : 'Not divider data'}`,db,'DATA DIVIDER CHUNK EXCEL')
            if (len > 1000) {
                firstChunks = cArray(data, 250);
                len = firstChunks.length
                isDivider = true
                log_worked('INFO',`Data dividend len=${len}`,db,'DATA DIVIDER CHUNK EXCEL')
            }
            for (let i = 0; i < len; i++) {
                const row = !isDivider ? data[i] : firstChunks[i];
                let text: string = ""
                if (!isDivider) {
                    text = headers.map((h: string, index: number) => `${h.toString().trim()}=${(row[index] || "")}`).join(';')
                } else {
                    row.map((e: any,i:number) => {
                        text += headers.map((h: string, index: number) => `${h.toString().trim()}=${(e[index] || "")}`).join(';')
                        text += "\n"
                    })
                }
                const values = [id, text, this.getToken(text)];
                if (db)
                    SqlDb.insert(db, 'CHUNKS', keys, values)
            }
            log_worked('INFO', `... terminate work chunks excel`, db)
            return true;
        } catch (err: any) {
            Scheduler.update(db, id, true)
            throw err;
        }
    }


}