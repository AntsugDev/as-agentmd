import dayjs from "dayjs";
import {ApiAbstract} from "./ApiAbstract.js";
import {ChatAntSugLLama} from "antsug-llma.ccp"
import { sessionChat, useSessionChat } from "../utility/utility.js";


export class Nolimits extends ApiAbstract {

    constructor(rag?:string|null) {
        super('no-limits', '', '', null, null, (rag ? rag : null));
    }
    
    sincro(): Promise<boolean> | boolean {
        return true;
    }

// @ts-ignore
    async chat(text: any[] | string): null | string | object {
        try {
            let request = "";
            if (this.rag) request += `${this.rag} \n User's question:`
            if (Array.isArray(text)) {
                let filter = text.findIndex((e) => e.role === 'user');
                if (filter > -1 && text[filter])
                    request += text[filter]?.content ?? ""
            } else request += text

            console.log('---------CHAT RESPONSE-----------')
            console.log('start:', dayjs().format('HH:mm:ss'))
            console.log('sessionChat',sessionChat)
            const response:any = await ChatAntSugLLama(request.toString(),this.previous)
            console.log('end:', dayjs().format('HH:mm:ss'))
            console.log('--------------------------')
            if(response){
                //@ts-ignore
                useSessionChat((response?.name_history ?? null))
                return response.response
            }
            else throw new Error("Chat noLimits exception")
        } catch (err: any) {
            throw err;
        }
    }

    uri_file(): Promise<any | null> {
        // @ts-ignore
        return null;
    }

} 