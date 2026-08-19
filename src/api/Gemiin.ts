import {callbackApi, Params} from "../utility/api.js";
import {RawGeminiModel} from "../interface/myInterface.js"
import {ApiAbstract} from "./ApiAbstract.js";
import {instruction} from "../utility/utility.js";
import {GoogleGenAI} from "@google/genai";
import mime from 'mime-types';
import fs from "fs/promises";

export class Gemini extends ApiAbstract {

    public prevousGemini: string | null;

    protected ai: any;
    protected model: any;


    constructor(files: any | null) {
        super('gemini', `https://generativelanguage.googleapis.com/v1beta/models?key=`, `https://generativelanguage.googleapis.com/v1beta/interactions?key=`, files);
        this.prevousGemini = null;
        this.ai = new GoogleGenAI({
            apiKey: this.extraApiKey()
        })
        this.model = this.getModelSelect()
    }

    // @ts-ignore
    async uri_file(): Promise<any | null> {
        try {
            const fileData: any[] = []
            if (this.files && Array.isArray(this.files)) {
                for (let i = 0; i < this.files.length; i++) {
                    const ele = this.files[i]
                    const uploadResult = await this.ai.files.upload({
                        file: ele.path,
                        config: {
                            displayName: ele.originalname,
                            mimeType: ele.mimetype
                        }
                    })
                    let computedMimeType = ele.mimetype;
                    if (!computedMimeType || computedMimeType === 'application/octet-stream') {
                        computedMimeType = mime.lookup(ele.originalname) || 'application/pdf';
                    }
                    if (uploadResult) {
                        const fileType = computedMimeType.startsWith('image/') ? 'image' : 'document';
                        fileData.push({
                            type: fileType,
                            uri: uploadResult.uri,
                            mime_type: uploadResult.mimeType
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
    async chat(text: any): null | string | object {
        try {
            const fileData = await this.uri_file();
            let input = [];
            input.push({
                type: 'text', text: text
            })
            if (fileData.length > 0)
                input.push(...fileData)
            const response = await this.ai.interactions.create({
                model: this.model, system_instruction: instruction,
                input: input,
                previous_interaction_id: this.prevousGemini,
                generation_config: {
                    temperature: 0.6,
                },
            })
            if (response) {
                const contents = response.output_text
                this.prevousGemini = response.id
                const usage = response.usage
                const input = usage.prompt_tokens;
                const output = usage.completion_tokens;
                this.token = {
                    input: input, output: output
                }
                if (contents) {
                    return contents;
                }

            }
            return null;
        } catch (err: any) {
            throw err;
        }
    }


    async sincro(): Promise<boolean> {
        try {
            this.preProviderInstance()
            const key = this.extraApiKey()
            const url = `${this.endPointModels}${key}`
            const r = await callbackApi({
                url: url,
                method: 'GET'
            } as Params)
            let $models: RawGeminiModel[] = []
            if (r && r?.data?.models) {
                this.clearModels()
                r.data.models.map((e: any) => {
                    const name = e.name
                    const displayName = e.displayName
                    const description = e.description
                    const limitIn = e.inputTokenLimit
                    const limitOut = e.outputTokenLimit
                    const v = e.version
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
                console.log("Gemini models update")
                return true;
            } else {
                console.log("Gemini models not found or exception system")
                return false;
            }
        } catch (err: any) {
            console.error(`Api extract model gemini error: ${err.toString()}`)
            return false
        }

    }

}
