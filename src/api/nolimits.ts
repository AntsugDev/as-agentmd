import {ApiAbstract} from "./ApiAbstract.js";
import {getLlama, LlamaChatSession, resolveModelFile} from "node-llama-cpp";
import path from "path";
import {dd, instruction} from "../utility/utility.js";

export let contextLLMAccp: any | null = null


export class Nolimits extends ApiAbstract {

    constructor() {
        super('no-limits', '', '', null, null);

    }

    public async _instance() {
        try {
            const instance = await getLlama({
                gpu: "vulkan"
            })
            const modelPath = await resolveModelFile(
                "hf:qtum/Qwen3-4B-GGUF:Q4_K_M",
                path.join(process.cwd(), "src", "gguf")
            );
            const model = await instance.loadModel({
                modelPath,
            })
            contextLLMAccp = await model.createContext();


        } catch (e: any) {
            throw e;
        }
    }

    protected async preAction() {
        if (!contextLLMAccp) throw new Error("Context not created")
        const sequence = contextLLMAccp.getSequence();
        try {
            let system = instruction;
            if (!this.previous)
                this.previous = new LlamaChatSession({
                    //@ts-ignore
                    contextLLMAccp,
                    systemPrompt: system,
                    contextSequence: sequence,
                    temperature: 0.5
                })

        } catch (e: any) {
            if (sequence) sequence.dispose()
            throw e;
        }
    }

    sincro(): Promise<boolean> | boolean {
        return true;
    }

// @ts-ignore
    async chat(text: any[] | string): null | string | object {
        try {
            await this.preAction()
            let request = "";
            if (this.rag) request += `${this.rag} \n User's question:`
            if (Array.isArray(text)) {
                let filter = text.findIndex((e) => e.role === 'user');
                if (filter > -1 && text[filter])
                    request += text[filter]?.content ?? ""
            } else request += text
            if (!this.previous) throw new Error("Session not found");
            const response = await this.previous.prompt(request);
            if (response)
                return response.toString();
            return null;
        } catch (err: any) {
            throw err;
        }
    }

    uri_file(): Promise<any | null> {
        // @ts-ignore
        return null;
    }

}