import fs from "fs/promises";
import * as os from "node:os";
import path from "path";
import dayjs from "dayjs";
import {awaitAllCallbacks} from "@langchain/core/callbacks/promises";

const tmp = os.tmpdir();
const files = path.join(tmp, 'files')

export const storage_put = async (nameFile: string, text: any) => {
    try {
        const fileDir = path.join(files, nameFile)
        await fs.writeFile(fileDir, text, 'utf-8');
        console.log(`File created in ${fileDir}`)
    } catch (err: any) {
        console.log('File not created', err)
    }
}

export const storage_exist = async (nameFile: string) => {
    try {
        const fileDir = path.join(files, nameFile)
        await fs.stat(fileDir)
        return true;
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return false;
        }
        throw err;
    }
}

export const storage_append = async (nameFile: string, text: any) => {
    try {
        const fileDir = path.join(files, nameFile)
        const dataFile = await storage_exist(nameFile)
        if (!dataFile) return storage_put(nameFile, text)
        await fs.appendFile(fileDir, `\n${text}`, 'utf-8')
        console.log(`The row added into file ${fileDir}`)
    } catch (err: any) {
        console.log('File not updated', err)
    }
}

export const storage_del = async (nameFile: string) => {
    try {
        const fileDir = path.join(files, nameFile)
        const dataFile = await storage_exist(nameFile)
        if (!dataFile) {
            throw new Error("File not found")
        }
        await fs.unlink(fileDir)
        console.log(`${fileDir} deleted`)
    } catch (err: any) {
        console.log('File not deleted', err)
    }
}

export const logger=async (status:'INFO'|'EXCEPTION',tag:string, msg:string, code?:number|string, stack?:string) => {
    try{
        const now = dayjs().format('YYYY_MM_DD');
        const fileName = `${now}_log.txt`;
        const time = dayjs().format('HH:mm:ss')
        let audit = `[${time}](${status}),${tag}: ${msg}`
        if(code || stack){
            audit +=`\n--------------------------------------------------\n- CODE:${(code ? code : 0)}\n- STACK:\n${stack}\n--------------------------------------------------------------------\n`
        }
        await storage_append(fileName,audit)
    }catch (err:any){
        console.log('Log not registered', err)
    }
}