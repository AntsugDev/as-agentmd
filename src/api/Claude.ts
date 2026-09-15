import {ApiAbstract} from "./ApiAbstract.js";
import {AxiosHeaders} from "axios";
import {callbackApi, Params} from "../utility/api.js";
import {RawGeminiModel} from "../interface/myInterface.js";
import dayjs from "dayjs";
import {instruction} from "../utility/utility.js";
import {Anthropic} from "@anthropic-ai/sdk";

export class Claude extends ApiAbstract {

    private anthropic: any | null;
    private apiKey: any | null;

    constructor(files: any | null, model: string | null) {
        super('claude', 'https://api.anthropic.com/v1/models', 'https://api.anthropic.com/v1/messages', files, model);
        this.apiKey = this.config?.get('providers.deep-seek.apiKey') ?? null
        if (!this.apiKey) this.anthropic = null
        this.anthropic = new Anthropic({
            apiKey: this.apiKey
        })
    }

// @ts-ignore
    async uri_file(): Promise<any | null> {
        try {
            return null;
        } catch (err: any) {
            return null;
        }
    }

    // @ts-ignore
    async chat(text: any[]|string): string | object | null {
        try {
            const model = !this.model ? this.getModelSelect() : this.model
            let system = instruction;
            if (this.rag) system += `\n---CONTEXT FROM LOCAL DOCUMENTS---\n ${this.rag}`
            const response = await this.anthropic.messages.create({
                model: model,
                system: system,
                messages: text,
                temperature: 0.6,
                max_tokens: 1500,
            })

            if (response) {
                let contents = "";
                response.content.filter((e:any) => e.type === 'text').map((e:any) => {
                    contents += `\n\r ${e.text}`
                });
                const input = response.usage?.input_tokens || 0;
                const output = response.usage?.output_tokens || 0;
                this.token = {
                    input: input,
                    output: output
                };

                if (contents) {
                    return contents;
                }
            }
        } catch (e) {
            console.log('chat claude deep seek exception ...')
            throw e;
        }
    }

    // @ts-ignore
    async sincro(): Promise<boolean> | boolean {
        try {
            if (!this.anthropic) throw new Error("Deep seek - claude not instance.")
            this.preProviderInstance()
            let $models: RawGeminiModel[] = []
            for await (const modelInfo of this.anthropic.models.list()) {
               $models.push({
                   name: modelInfo.id,
                   displayName: modelInfo.display_name,
                   description:null,
                   inputTokenLimit:modelInfo.max_input_tokens,
                   outputTokenLimit: null,
                   version:modelInfo.created_at
               })
            }
            if ($models.length > 0) {
                this.setModels($models)
                console.log("Claude models update")
                return true;
            } else {
                console.log("Claude models not found or exception system")
                return false;
            }

        } catch (err: any) {
            console.error(`Api extract model claude error: ${err.toString()}`)
            return false
        }
    }

}