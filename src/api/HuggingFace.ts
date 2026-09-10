import {pipeline} from '@huggingface/transformers';

export class HuggingFace {

    public static async instance() {
        try {
            return await pipeline('feature-extraction',
                'Xenova/all-MiniLM-L6-v2');
        } catch (err: any) {
            throw err;
        }
    }

    public static async embeddings(_class: any, content: any) {
        try {
            const response = await _class(content, {
                pooling: 'mean',
                normalize: true
            })
            return Array.from(response.data) as number[];
        } catch (err: any) {
            throw err;
        }
    }


}