#!/usr/bin/env node

import {Command} from 'commander';
import {Server} from "./command/Server.js";
import {SqlDb} from "./database/database.js";
import {HuggingFace} from "./api/HuggingFace.js";
import {createVector} from "./utility/utility.js";
import fs from "fs/promises";
import path from "path";
import * as os from "node:os";

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
program.name('create_vector').command('create-vector <input>').action(async (input: string) => {
    try {
        const result = await createVector(input);
        if (result.length > 0) {
            const file = path.join(os.tmpdir(), '/files/vector.json')
            await fs.writeFile(file, JSON.stringify(result), 'utf-8')
            console.log('file creato', file)
        } else
            console.log('Vector not created')
    } catch (e: any) {
        console.log('eccezione creazione vettore ...', e)
    }
})

program.parse(process.argv);


