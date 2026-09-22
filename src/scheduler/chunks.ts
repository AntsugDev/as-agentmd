import {SqlDb} from "../database/database.js";
import {db} from "../index.js";
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {getEncoding} from "js-tiktoken";
import {clearInterval} from "node:timers";

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

    protected static async insert(e: any, id: number, keys: string[]) {
        try {
            const text = e.pageContent
            const values = [id, text, this.getToken(text)];
            SqlDb.insert(db, 'CHUNKS', keys, values)
        } catch (e: any) {
            throw e;
        }
    }


    public static async text_chunk(data: any, id: number) {

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

    public static async data_chunk(data: any[], id: number) {
        try {
            const headers = data[0]
            const len = headers.length
            let increment = len >= 10 ? 3 : 5;
            const lenData = (data.length - 1)
            if (lenData >= 1000) {
                increment = len >= 10 ? 500 : 1000;
            }
            const keys = ['FILE_ID', 'CONTENT', 'TOKENS'];

            for (let i = 1; i < len; i += increment) {
                const chunkRows = data.slice(i, i + increment);
                const text = JSON.stringify([headers, chunkRows]);
                const values = [id, text, this.getToken(text)];
                SqlDb.insert(db, 'CHUNKS', keys, values)
            }

            return true;
        } catch (err: any) {
            console.log('Eccezione creazione chunks excel', err)
            throw err;
        }
    }


}