import {ChatText} from "../interface/myInterface.js";
import {instruction} from "./utility.js";
import {Message} from "ollama";
import {configStore} from "../config.js";

export class ChatClass {

    private _msg: ChatText[] | Message[] | any;
    private provider: string | null;


    constructor(provider: string | null) {
        this._msg = [];
        // @ts-ignore
        this.provider = provider
    }

    private _is(): boolean {
        if (this.provider) {
            return new Boolean(this.provider !== 'gemini').valueOf()
        }
        throw new Error("Impossibile conoscere il provider")
    }

    public init(): void | null | object {
        try {
            if (this._is())
                this._msg.push({
                    role: 'system',
                    content: instruction
                })
        } catch (e) {
            console.log("eccezione", e)
        }
    }

    public pUser(text: string) {
        try {
            if (this._is())
                this._msg.push({
                    role: 'user',
                    content: text
                })
        } catch (e) {
            console.log("eccezione", e)
        }

    }

    public pAgent(text: string | null) {
        try {
            if (text) {
                if (this._is())
                    this._msg.push({
                        role: 'assistant',
                        content: text
                    })
            }
        } catch (e) {
            console.log("eccezione", e)
        }
    }


    get msg(): ChatText[] | Message[] | any[] {
        return this._msg;
    }
}