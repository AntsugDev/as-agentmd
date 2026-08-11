import {DataUtility} from "../utility/DataUtility.js";
import {ChatText} from "../interface/myInterface.js";
import {Message} from "ollama";

export abstract class ApiAbstract extends DataUtility {

    protected provider: string;
    protected endPointModels: string | null;
    protected endPointChat: string | null

    constructor(provider: string, endPointModels: string | null, endPointChat: string | null) {
        super(provider)
        this.provider = provider
        this.endPointChat = endPointChat
        this.endPointModels = endPointModels
    }

    // @ts-ignore
    abstract async sincro(): Promise<boolean> | boolean

// @ts-ignore
    abstract async chat(text: any[]): Message|ChatText|null

}

