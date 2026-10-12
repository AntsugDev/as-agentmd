import { SqlDb } from "../database/database.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getEncoding } from "js-tiktoken";
import { log_worked } from "../utility/storage.js";
import Database from "better-sqlite3";
import { Scheduler } from "./Scheduler.js";

export const enc = getEncoding("cl100k_base");

type FileType = "pdf" | "word" | "md" | "txt";

export class Chunks {
    private static getToken(text: string): number {
        try {
            const tokens: number[] = enc.encode(text);
            return tokens.length;
        } catch (err: any) {
            throw err;
        }
    }

    protected static normalize(text: string): string {
        return text
            .replace(/([^\n])\n([^\n])/g, "$1 $2") // a capo singolo -> spazio
            .replace(/[ \t]+/g, " "); // spazi multipli -> uno solo
    }

    public static async text_chunk(
        data: any,
        id: number,
        db: Database.Database | undefined,
        ext: string,
    ) {
        try {
            log_worked("INFO", `Start work chunks text ...`, db);
            let splitter: any | null = null;
            if (ext === "md")
                splitter = RecursiveCharacterTextSplitter.fromLanguage(
                    "markdown",
                    {
                        chunkSize: 800,
                        chunkOverlap: 100,
                    },
                );
            else
                splitter = new RecursiveCharacterTextSplitter({
                    chunkSize: 800,
                    chunkOverlap: 100,
                    separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""],
                    keepSeparator: true,
                });
            const keys = ["FILE_ID", "CONTENT", "TOKENS"];
            const outputChunks = await (
                await splitter.createDocuments([this.normalize(data)])
            )?.filter((d: any) => d.pageContent.trim().length > 0);
            outputChunks.map((e:any) => {
                const text = e.pageContent;
                const values = [id, text, this.getToken(text)];
                SqlDb.insert(db, "CHUNKS", keys, values);
            });
            log_worked("INFO", `... terminate work chunks text`, db);
            return true;
        } catch (err: any) {
            Scheduler.update(db, id, true, "ko");
            throw err;
        }
    }

    public static async data_chunk(
        data: any[],
        id: number,
        db: Database.Database | undefined,
    ) {
        let msg = "";
        try {
            log_worked("INFO", `Start work chunks excel ...`, db);
            const headers = data[0];
            const keys = ["FILE_ID", "CONTENT", "TOKENS"];
            data.shift();
            let len = data.length;
            log_worked(
                "INFO",
                `Len data ${len}. ${len > 1000 ? "Divider data" : "Not divider data"}`,
                db,
                "DATA DIVIDER CHUNK EXCEL",
            );
            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const text = JSON.stringify(
                    Object.fromEntries(
                        headers.map((h: string, index: number) => [
                            h ? h.toString().trim() : `col_${index}`,
                            row[index] ?? "",
                        ]),
                    ),
                );
                const values = [id, text, this.getToken(text)];
                if (db) SqlDb.insert(db, "CHUNKS", keys, values);
            }
            log_worked("INFO", `... terminate work chunks excel`, db);
            return true;
        } catch (err: any) {
            Scheduler.update(db, id, true);
            throw err;
        }
    }
}
