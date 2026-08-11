import {DataUtility} from "../utility/DataUtility.js";
import {AgentConfig, ChatText} from "../interface/myInterface.js";
import {Message} from "ollama";
import Conf from "conf";
import {configStore} from "../config.js";

export abstract class ApiAbstract extends DataUtility {

    protected provider: string;
    protected endPointModels: string | null;
    protected endPointChat: string | null
    private config: Conf<AgentConfig> | null;

    constructor(provider: string, endPointModels: string | null, endPointChat: string | null) {
        super(provider)
        this.provider = provider
        this.endPointChat = endPointChat
        this.endPointModels = endPointModels
        this.config = configStore;
    }

    getModelSelect(): string | null {
        try {
            if(!this.config) throw new Error("Configuration not found");
            const modelData = this.config.get('modelSelected');
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

    // @ts-ignore
    abstract async sincro(): Promise<boolean> | boolean

// @ts-ignore
    abstract async chat(text: any[]): null |string| object

}

