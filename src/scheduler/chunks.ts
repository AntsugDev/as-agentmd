import {SqlDb} from "../database/database.js";
import {db} from "../index.js";
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import { getEncoding} from "js-tiktoken";

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


    public static async text_chunk(data: any, id: number) {

        try {
            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 800,
                chunkOverlap: 150,
                separators: ["#", "\n## ", "\n### ", "\n\n", "\n", " "],
            });
            const keys = ['FILE_ID', 'CONTENT', 'TOKENS'];
            const outputChunks = await splitter.createDocuments([data]);
            outputChunks.map(e => {
                const text = e.pageContent
                const values = [id, text, this.getToken(text)];
                SqlDb.insert(db, 'CHUNKS', keys, values)
            })
            return true;

        } catch (err: any) {
            console.log('Eccezione creazione chunks file di testo', err)
            throw err;
        }
    }

    public static async data_chunk(data: any[], id: number) {
        try {
            const len = data.length
            const increment = len >= 10 ? 3 : 5;
            const headers = data[0]
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