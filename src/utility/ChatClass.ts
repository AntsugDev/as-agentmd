import {ChatText} from "../interface/myInterface.js";
import {instruction} from "./utility.js";
import {Message} from "ollama";

export class ChatClass {

    private _msg: ChatText[] | Message[];

    constructor() {
        this._msg = [];
    }

    public init() {
        this._msg.push({
            role: 'system',
            content: instruction
        })
    }

    public pUser(text: string) {
        this._msg.push({
            role: 'user',
            content: text
        })
    }

    public pAgent(text: string | null) {
        if (text)
            this._msg.push({
                role: 'assistant',
                content: text
            })
    }


    get msg(): ChatText[] | Message[] {
        return this._msg;
    }
}