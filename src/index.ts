#!/usr/bin/env node

import {Command} from 'commander';
import {Server} from "./command/Server.js";
import {SqlDb} from "./database/database.js";
import {Scheduler} from "./scheduler/Scheduler.js";
export const db = await new SqlDb().create()
const program = new Command();
program
    .name('agentmd')
    .description('Custom CLI for prompt automation and context engineering')
    .version('0.0.1');
//----server----
const server = new Server(program)
server.getData()

program.parse(process.argv);