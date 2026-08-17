import {stat, unlink, writeFile, appendFile, readFile} from "fs/promises";
import os from 'os';
import path from 'path';
import {instruction} from "../utility/utility.js";

const tmpSO = os.tmpdir();

interface ChatMessage {
    role: string,
    content: string
}

export class ChatFe {

    private static storage: Map<string, ChatMessage[]> = new Map<string, ChatMessage[]>()

    private static _append(role: 'user' | 'assistant', content: string, uuid: string): void {
        try {
            const histoy = this.storage.get(uuid)
            if (histoy) {
                histoy.push({
                    role: role, content: content
                } as ChatMessage)
                this.storage.set(uuid, histoy)
            }
        } catch (err: any) {
            console.error("Append file error", err);
        }
    }

    public static init(uuid: string, msg: string | null, status: boolean): void {
        try {
            const i: ChatMessage[] =[ {
                role: "system", content: instruction
            }]
            this.storage.set(uuid, i)
            if (status && msg)
                this.user(msg, uuid)
        } catch (err: any) {
            console.error("Init chat error", err);
        }
    }

    public static user(content: string, uuid: string): void {
        try {
            this._append('user', content, uuid)
        } catch (err: any) {
            console.error("User chat error", err);
        }
    }

    public static assistant(content: string, uuid: string): void {
        try {
            this._append('assistant', content, uuid)
        } catch (err: any) {
            console.error("Assistant chat error", err);
        }
    }

    public static getFile(uuid: string): any[] {
        try {
            return this.storage.get(uuid) ?? []
        } catch (err: any) {
            console.error(`Read file error ${err.toString()}`);
            return [];
        }
    }

    public static delStorage(uuid: string):void {
        this.storage.delete(uuid)
    }

    public static clearAll():void {
        this.storage.clear()
    }
}