import {ApiAbstract} from "./ApiAbstract.js";
import {Mistral} from "@mistralai/mistralai";
import {RawGeminiModel} from "../interface/myInterface.js";
import {UsageInfo} from "@mistralai/mistralai/models/components";
import {openAsBlob} from "node:fs";

export class MistralClass extends ApiAbstract {

    protected client: any;
    protected key: any | null;
    protected models: any | null;

    constructor(files: any | null) {
        super('mistral', '', '', files);

        this.key = this.extraApiKey()
        this.models = this.getModelSelect()
        this.client = new Mistral({
            apiKey: this.key.trim(),
        });
    }

    // @ts-ignore
    async uri_file(): Promise<any | null> {
        return null;
        //ocr serve per fare rag
    }

    // @ts-ignore
    async chat(text: any[]): string | object | null {
        try {
            if (!this.models) {
                console.error("Models not selected")
                return null;
            }
            let options = {
                model: this.models,
                messages: text,
                temperature: 0.5,
                documents: []
            }
            const files = await this.uri_file()
            if (files)
                options.documents = files
            const response = await this.client.chat.complete(options)
            if (response) {
                const usage: UsageInfo | null = response.usage
                if (usage) {
                    const input = usage?.promptTokens ?? 0;
                    const output = usage?.completionTokens ?? 0;

                    this.token = {
                        input: input, output: output
                    }
                }
                return response?.choices[0]?.message?.content ?? "Error"
            }
            return null;
        } catch (err: any) {
            console.error(err.toString())
            return null;
        }
    }

    // @ts-ignore
    async sincro(): Promise<boolean> | boolean {
        try {
            this.preProviderInstance();
            const key = this.extraApiKey()
            if (!key) {
                console.error("Key not found")
                return false;
            }
            const response = await new Mistral({
                apiKey: key.trim(),
            }).models.list()
            let $models: RawGeminiModel[] = []
            if (response && response?.data) {
                response.data.map((e: any) => {
                    const name = e.id
                    const displayName = e.name
                    const description = e.description
                    const limitIn = null
                    const limitOut = null
                    const v = null
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
                console.log("Mistral models update")
                return true;
            } else {
                console.log("Mistral models not found or exception system")
                return false;
            }

        } catch (err: any) {
            console.error(`Api extract model mistral error: ${err.toString()}`)
            return false;
        }
    }

}