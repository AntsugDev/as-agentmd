import {ApiAbstract} from "./ApiAbstract.js";
import {Anthropic} from "@anthropic-ai/sdk";
import {RawGeminiModel} from "../interface/myInterface.js";
import {instruction} from "../utility/utility.js";
import fs from "fs/promises";

export class ClaudeThroughDeepSeek extends ApiAbstract {

    private anthropic: any | null;
    private apiKey: any | null;

    constructor(files: any | null, model: string | null, rag?: string | null) {
        super('claude-deep-seek', '', '', files, model, (rag ? rag : null));
        this.apiKey = this.config?.get('providers.deep-seek.apiKey') ?? null
        if (!this.apiKey) this.anthropic = null
        this.anthropic = new Anthropic({
            baseURL: 'https://api.deepseek.com/anthropic',
            apiKey: this.apiKey
        })

    }

    // @ts-ignore
    async chat(text: any): null | string | object {
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

    async sincro(): Promise<boolean> {
        try {
            if (!this.anthropic) throw new Error("Deep seek - claude not instance.")
            this.preProviderInstance()
            let $models: RawGeminiModel[] = []
            const modelCsv = await fs.readFile('./src/api/modelli_claude.csv', 'utf-8');
            const explode = modelCsv.toString().split('\n')
            for (let i = 1; i < explode.length; i++) {
                if (explode[i] !== '') {
                    const row = explode[i].split(';')
                    $models.push({
                        name: row[1],
                        displayName: row[0],
                        description: row[2],
                        inputTokenLimit: null,
                        outputTokenLimit: null,
                        version: null
                    })
                }
            }
            if ($models.length > 0) {
                this.setModels($models)
                console.log("Deep seek - claude models update")
                return true;
            } else {
                console.log("Deep seek - claude models not found or exception system")
                return false;
            }
        } catch (err: any) {
            throw err;
        }
    }

    // @ts-ignore
    async uri_file(): Promise<any | null> {
        return null;
    }


}