import {instruction} from "../utility/utility.js";
import * as os from "node:os";
import path from "path";
import fs from "fs";
import * as fs_promise from "fs/promises" ;
import dayjs from "dayjs";
import {unlink} from "node:fs/promises";


interface ChatMessage {
    role: string,
    content: string,
    order: number
}

export class ChatFe {

    private static storage: Map<string, ChatMessage[]> = new Map<string, ChatMessage[]>()

    private static async _append(role: 'user' | 'assistant', content: string, uuid: string): Promise<void> {
        try {
            let histoy = this.storage.get(uuid)
            if (!histoy) {
                await this.recupera(uuid)
                histoy = this.storage.get(uuid)
            }
            if (histoy) {
                histoy.push({
                    role: role, content: content, order: (histoy.length + 1)
                } as ChatMessage)
                this.storage.set(uuid, histoy)
            }
        } catch (err: any) {
            console.error("Append file error", err);
        }
    }

    public static async init(uuid: string, msg: string | null, role: 'user' | 'system', status: boolean): Promise<void> {
        try {
            let content = instruction
            if (role === 'user')
                content = msg ? msg : ""
            const i: ChatMessage[] = [{
                role: role, content: content, order: 1
            }]
            this.storage.set(uuid, i)
            if (status && msg)
                await this.user(msg, uuid)
        } catch (err: any) {
            console.error("Init chat error", err);
        }
    }

    public static async user(content: string, uuid: string): Promise<void> {
        try {
            await this._append('user', content, uuid)
        } catch (err: any) {
            console.error("User chat error", err);
        }
    }

    public static async assistant(content: string, uuid: string): Promise<void> {
        try {
            await this._append('assistant', content, uuid)
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

    public static delStorage(uuid: string): void {
        this.storage.delete(uuid)
    }

    public static clearAll(): void {
        this.storage.clear()
    }

    public static async _archive(globalM: any, uuid: string, nameFile: string | null = null): Promise<any> {
        try {
            const tmp = os.tmpdir()
            const time = dayjs().format('YYYYMMDD')
            const directory = path.join(tmp, `chat`)
            await fs_promise.mkdir(directory, {recursive: true})
            let file = path.join(directory, `${uuid}_${time}.json`)
            if (nameFile)
                file = path.join(directory, nameFile)

            fs.writeFile(file, JSON.stringify(globalM, null, 2), 'utf-8', (e) => {
                if (e) throw e;
            })
            return time;
        } catch (err: any) {
            console.error("Chat not archived ", err)
            return err.toString();
        }
    }

    public static async del_archive(uuid: string, time: string | null) {
        try {
            if (this.storage.has(uuid))
                this.storage.delete(uuid)
            if (!time) return false;
            const file_name = `${uuid}_${time}.json`
            const tmp = os.tmpdir()
            const file = path.join(tmp, `chat/${file_name}`)
            const stat = await fs_promise.stat(file)
            if (stat.isFile())
                unlink(file)
            else throw new Error(`File not found ${file}`)
            return true;

        } catch (err: any) {
            console.error("File not deleted ", err)
            return false
        }
    }

    public static async clear_archive(all:boolean = true) {
        try {
            const tmp = os.tmpdir()
            const directory = path.join(tmp, `chat`);
            let allFiles: string[] = await fs_promise.readdir(directory) ?? []
            if(!all){
                const now = dayjs()
                allFiles = allFiles.filter((e:string) => {
                    const day = dayjs(e.split('_')[1].toString().replace('.json', ''),'YYYYMMDD') ?? null
                    return now.diff(day,'days') >= 3;
                })
            }
            allFiles.forEach((e: string) => {
                unlink(path.join(directory, e))
            })
            return true;

        } catch (err: any) {
            console.error("File not deleted ", err)
            return false
        }
    }

    public static async clear_uploads() {
        try {
            const tmp = os.tmpdir()
            const directory = path.join(tmp, `uploads`);
            let allFiles: string[] = await fs_promise.readdir(directory) ?? []
            allFiles.forEach((e: string) => {
                unlink(path.join(directory, e))
            })
            return true;

        } catch (err: any) {
            console.error("File not deleted ", err)
            return false
        }
    }

    public static async recupera(uuid: string): Promise<any | null> {
        try {
            const tmp = os.tmpdir()
            const directory = path.join(tmp, `chat`)
            const file = path.join(directory, `${uuid}.json`)
            const response = await fs_promise.readFile(file, 'utf8');
            if (response) {
                this.storage.set(uuid, JSON.parse(response))
            }
            return null;
        } catch (err: any) {
            console.error("Chat not archived ", err)
            return err.toString();
        }
    }
}