import * as os from "node:os";
import path from "path";
import fs from "fs/promises";
import dayjs from "dayjs";
import {unlink} from "node:fs/promises";

const dir = os.tmpdir()
const directory = (d: 'chat' | 'files') => path.join(dir, d)

export class ClearDirectory {


    protected static async clear_chat() {

        try {
            const d = directory('chat');
            const files = await fs.readdir(d)
            for (const file of files) {
                const filePath = path.join(d, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    const date = dayjs(file.toString().split('_')[1], 'YYYYMMDD')
                    const now = dayjs()
                    if (Math.abs(date.diff(now, 'd')) >= 30)
                        await unlink(filePath)
                }
            }
            return true;
        } catch (e: any) {
            throw e;
        }

    }

    protected static async clear_files() {

        try {
            const d = directory('files');
            const files = await fs.readdir(d)
            for (const file of files) {
                const filePath = path.join(d, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    if (file.toString().indexOf('log') !== -1) {
                        const split = file.toString().split('_');
                        const date = dayjs(`${split[0]}${split[1]}${split[2]}`, 'YYYYMMDD')
                        const now = dayjs()
                        if (Math.abs(date.diff(now, 'd')) >= 30)
                            await unlink(filePath)
                    }
                }
            }
            return true;
        } catch (e: any) {
            throw e;
        }

    }

    public static async worked() {
        try {
            if (!await this.clear_chat() ||
                !await this.clear_files()) {
                setTimeout(() => {
                    this.worked()
                }, 120000)
            }
        } catch (err: any) {
            throw err;
        }
    }


}