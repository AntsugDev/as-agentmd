import {Command} from "commander";
import {configStore, providers} from "../config.js";
import Conf from "conf";
import {AgentConfig} from "../interface/myInterface.js";

export abstract class AbstractProgram {
    protected program: Command;
    protected providers: string[];
    protected config:any|null|Conf<AgentConfig>

    constructor(program: Command) {
        this.program = program
        this.providers = providers()
        this.config = configStore
    }

    public abstract setData():void;

    public abstract getData(key:string):any|null|undefined;

    public abstract getDataAll():void;
}