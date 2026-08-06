#!/usr/bin/env node

import {Command} from 'commander';
import {configStore, providers} from "./config.js";
import * as readline from "node:readline";
import {ApiKey} from "./command/apiKey.js";

const program = new Command();
const p = providers();
program
    .name('agentmd')
    .description('Custom CLI for prompt automation and context engineering')
    .version('0.0.1');
//---------command for api key--------------------
const apiKey = new ApiKey(program)
apiKey.setData()
apiKey.getDataAll()


program.parse(process.argv);