import dayjs from "dayjs";
import {ApiAbstract} from "./ApiAbstract.js";
import {ChatAntSugLLama} from "antsug-llma.ccp"


export class Nolimits extends ApiAbstract {

    constructor() {
        super('no-limits', '', '', null, null);
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
            console.log('previous', this.previous)
            const response:any = await ChatAntSugLLama(text.toString(),this.previous)
            console.log(response)
            console.log('end:', dayjs().format('HH:mm:ss'))
            console.log('--------------------------')
            if(response){
                //todo @@ bug fix
                this.previous = response.name_history
                return response.response
            }
        } catch (err: any) {
            throw err;
        }
    }

    uri_file(): Promise<any | null> {
        // @ts-ignore
        return null;
    }

}