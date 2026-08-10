#!/usr/bin/env node

import {Command} from 'commander';
import { providers} from "./config.js";
import {ApiKey} from "./command/apiKey.js";
import {Sync} from "./command/sync.js";
import {ConfigData} from "./command/ConfigData.js";
import {SelectMode} from "./command/SelectMode.js";
import {Chat} from "./command/Chat.js";

const program = new Command();
const p = providers();
program
    .name('agentmd')
    .description('Custom CLI for prompt automation and context engineering')
    .version('0.0.1');

//---------command for data config--------------------
const c = new ConfigData(program)
c.getDataAll()
c.getData()

//---------command for api key--------------------
const apiKey = new ApiKey(program)
apiKey.setData()
apiKey.getDataAll()

//---------command for sync--------------------
const sync = new Sync(program)
sync.setData()
sync.getData()

//------------select models------
const select = new SelectMode(program)
select.setData()

//----chat----
const chat = new Chat(program)
chat.setData()

program.parse(process.argv);