import {ApiAbstract} from "./ApiAbstract.js";
import {callbackApi, Params} from "../utility/api.js";
import {AxiosHeaders} from "axios";
import {RawGeminiModel} from "../interface/myInterface.js";
import dayjs from "dayjs";
import fs from "fs";
import * as fs_promise from "fs/promises";
import {instruction} from "../utility/utility.js";
import OpenAI from "openai";
import {storage_put} from "../utility/storage.js";

export class OpenAiClass extends ApiAbstract {

    protected ai: any | null;
    protected fromDeepSeek:boolean = false;
    protected apiKey:any|null;

    constructor(files: any | null, model: string | null, fromDeepSeek:boolean = false) {
        super((!fromDeepSeek ? 'openai' : 'openai-deep-seek'), 'https://api.openai.com/v1/models', 'https://api.openai.com/v1/chat/completions', files, model);
        this.fromDeepSeek = fromDeepSeek
        this.model = null;
        this.model = !model ? this.getModelSelect() : model
        this.apiKey = fromDeepSeek ?  (this.config?.get('providers.deep-seek.apiKey') ?? null) : this.extraApiKey()
        if(!this.fromDeepSeek)
        this.ai = new OpenAI({
            apiKey: this.apiKey
        })
        else
            this.ai = new OpenAI({
                apiKey: this.apiKey,
                baseURL: 'https://api.deepseek.com'
            })
    }

    // @ts-ignore
    async uri_file(): Promise<any | null> {
        try {
            const fileData = [];
            if (!this.ai) throw new Error("Openai non instanziato")

            if (this.files && Array.isArray(this.files)) {
                for (let i = 0; i < this.files.length; i++) {
                    const ele = this.files[i]
                    const file = await this.ai.files.create({
                        file: fs.createReadStream(ele.path),
                        purpose: "user_data"
                    })
                    if (file) {
                        const type = ele.mimeType.toString().indexOf('image') !== -1 ? 'input_image' : 'input_file'
                        fileData.push({
                            type: type,
                            file_id: file.id,
                        })
                    }
                }
            }
            return fileData;
        } catch (err: any) {
            throw err;
        }
    }

// @ts-ignore
    async chat(text: any[]): string | object | null {
        try {
            if (!this.ai) throw new Error("Openai non instanziato")
            const files = await this.uri_file()
            let input: {
                role: 'user' | 'assistant',
                content: {
                    type: string, text: string
                }[]
            }[] = []
            const user: {
                type: string, text: string
            }[] = []
            const assistant: {
                type: string, text: string
            }[] = []

            text.filter(e => {
                return e.role !== 'system'
            }).map(e => {
                if (e.role === 'user')
                    user.push(
                        {
                            type: 'input_text', text: e.content
                        }
                    )
                else
                    assistant.push({
                            type: 'output_text', text: e.content
                        }
                    )

            })
            if (user.length > 0)
                input.push({
                    role: 'user', content: user
                })
            if (files) {
                // @ts-ignore
                const f = input.findIndex((e: any) => {
                    return e.role === 'user'
                })
                if (f > 0) {
                    let content = input[f].content
                    content.push(files)
                    input[f].content = content
                }

            }
            if (assistant.length > 0)
                input.push({
                    role: 'assistant', content: assistant
                })
            const options = {
                model: this.model,
                instructions: instruction,
                input: input
            }
            const response = await this.ai.responses.create(options)
            const usage = response.usage
            if (usage) {
                const input = usage.input_tokens;
                const output = usage.output_tokens;
                this.token = {
                    input: input, output: output
                }
            }
            if (response.output_text)
                return response.output_text ?? "Errore di sistema";
            return null;

        } catch (err: any) {
            throw err;
        }
    }
    protected async sincro_deep_seek(){
        try{
            if (!this.ai) throw new Error("Deep seek - openAi not instance.")
            let $models: RawGeminiModel[] = []
            const modelCsv = await fs_promise.readFile('./src/api/openai_models.csv', 'utf-8');
            const explode = modelCsv.toString().split('\n')
            for (let i = 1; i < explode.length; i++) {
                if (explode[i] !== '') {
                    const row = explode[i].split(';')
                    $models.push({
                        name: row[0],
                        displayName: row[1],
                        description: row[2],
                        inputTokenLimit: parseInt(row[3]),
                        outputTokenLimit: parseInt(row[4]),
                        version: null
                    })
                }
            }
            if ($models.length > 0) {
                this.setModels($models)
                console.log("Deep seek - openAi models update")
                return true;
            } else {
                console.log("Deep seek - openAi models not found or exception system")
                return false;
            }

        }catch (err:any){
            throw err;
        }
    }

    protected async sincro_openAi(){
        try{
            const key = this.apiKey
            const headers: AxiosHeaders = new AxiosHeaders();
            headers.set('Authorization', `Bearer ${key}`)
            headers.set('Content-Type', `application/json`)
            const response = await callbackApi({
                url: this.endPointModels,
                method: 'GET',
                headers: headers
            } as Params)
            let $models: RawGeminiModel[] = []
            if (response && response?.data) {
                response.data.data.map((e: any) => {
                    const name = e.id
                    const displayName = e.id
                    const description = null
                    const limitIn = null
                    const limitOut = null
                    const v = dayjs(e.created).format('YYYY-MM-DD HH:MI:SS')
                    $models.push({
                        name: name,
                        displayName: displayName,
                        description: description,
                        inputTokenLimit: limitIn,
                        outputTokenLimit: limitOut,
                        version: v
                    })
                })
            }
            if ($models.length > 0) {
                this.setModels($models)
                console.log(`(${this.fromDeepSeek  ? 'OpenAi Deep Seek' : 'OpenAi'}) models update`)
                return true;
            } else {
                console.log(`(${this.fromDeepSeek  ? 'OpenAi Deep Seek' : 'OpenAi'})  models not found or exception system`)
                return false;
            }
        }catch (err:any){
            throw err;
        }
    }

    async sincro(): Promise<boolean> {
        try {
            this.preProviderInstance();
            if(this.fromDeepSeek)
                return this.sincro_deep_seek()
            else
                return this.sincro_openAi()


        } catch (err: any) {
            throw err;
        }
    }

}