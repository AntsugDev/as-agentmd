#!/usr/bin/env node

import {Command} from 'commander';
import {Server} from "./command/Server.js";
import {SqlDb} from "./database/database.js";
import {HuggingFace} from "./api/HuggingFace.js";

await new SqlDb().create()
await HuggingFace.instance()

export const program = new Command();
program
    .name('agentmd')
    .description('Custom CLI for prompt automation and context engineering')
    .version('0.0.1');
//----server----
const server = new Server(program)
server.getData()
program.parse(process.argv);


