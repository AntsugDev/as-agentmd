import {pipeline} from '@huggingface/transformers';
export let _class:any|null =  null;
export class HuggingFace {

    public static async instance() {
        try {
            const c  =  await pipeline('feature-extraction',
                'Xenova/all-MiniLM-L6-v2');
            _class = c;
            return c;
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