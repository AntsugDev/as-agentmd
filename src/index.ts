#!/usr/bin/env node

import {Command} from 'commander';
import {Server} from "./command/Server.js";
import {SqlDb} from "./database/database.js";
import {HuggingFace} from "./api/HuggingFace.js";
import {createVector} from "./utility/utility.js";
import fs from "fs/promises";
import path from "path";
import * as os from "node:os";
import {Rag} from "./utility/Rag.js";

await new SqlDb().create(true)
await HuggingFace.instance()

export const program = new Command();
program
    .name('agentmd')
    .description('Custom CLI for prompt automation and context engineering')
    .version('0.0.1');
//----server----
const server = new Server(program)
server.getData()
//@@ Command for testing ---------------------------------------------------
program.name('create_vector').command('create-vector <input> <tag>').action(async (input: string, tag: string) => {
    try {
        const content = await new Rag(input, tag).result()
        const textConvert = await createVector(input);
        const fContent = path.join(os.tmpdir(), '/files/content.txt')
        const file = path.join(os.tmpdir(), '/files/vector.json')
        await fs.writeFile(file, JSON.stringify(textConvert[0]), 'utf-8')
        await fs.writeFile(fContent, JSON.stringify(content), 'utf-8')
        console.log(`File creati. Vector=${file};Content=${fContent}`)
    } catch (e: any) {
        console.log('eccezione creazione vettore ...', e)
    }
})
//-------------------------------------------------------------------------

program.parse(process.argv);


