import {DataUtility} from "../utility/DataUtility.js";
import {AgentConfig, ChatText} from "../interface/myInterface.js";
import {Message} from "ollama";
import Conf from "conf";
import {configStore} from "../config.js";
import Database from "better-sqlite3";
import {db} from "../index.js";
import {files} from "@mistralai/mistralai";

export abstract class ApiAbstract extends DataUtility {

    protected provider: string;
    protected endPointModels: string | null;
    protected endPointChat: string | null
    private _config: Conf<AgentConfig> | null;
    public token: { input: number, output: number };
    public files: any | null;
    protected model: string | null;
    protected db: Database.Database | undefined

    constructor(provider: string, endPointModels: string | null, endPointChat: string | null, files: any | null, model: string | null) {
        super(provider)
        this.db = db;
        this.provider = provider
        this.endPointChat = endPointChat
        this.endPointModels = endPointModels
        this._config = configStore;
        this.token = {
            input: 0, output: 0
        }
        this.files = files
        this.model = model
    }

    getModelSelect(): string | null {
        try {
            if (!this._config) throw new Error("Configuration not found");
            const modelData = this._config.get('modelSelected');
            if (!modelData) {
                console.error("Model not selected")
                return null;
            } else {
                return modelData.toString().split('|')[1]
            }
        } catch (err: any) {
            throw err;
        }
    }


    get config(): Conf<AgentConfig> | null {
        return this._config;
    }

// @ts-ignore
    abstract async sincro(): Promise<boolean> | boolean

// @ts-ignore
    abstract async chat(text: any[]): null | string | object

    // @ts-ignore
    abstract async uri_file(): Promise<any | null>

}

