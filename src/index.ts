#!/usr/bin/env node

import {Command} from 'commander';
import {configStore, providers} from "./config.js";
import {ApiKey} from "./command/apiKey.js";
import {Sync} from "./command/sync.js";
import {ConfigData} from "./command/ConfigData.js";

const program = new Command();
const p = providers();
program
    .name('agentmd')
    .description('Custom CLI for prompt automation and context engineering')
    .version('0.0.1');

//---------command for data config--------------------
const c = new ConfigData(program)
c.getDataAll()

//---------command for api key--------------------
const apiKey = new ApiKey(program)
apiKey.setData()
apiKey.getDataAll()

//---------command for sync--------------------
const sync = new Sync(program)
sync.setData()
sync.getData()

program.parse(process.argv);