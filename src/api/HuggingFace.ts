import {pipeline} from '@huggingface/transformers';
export let _class:any|null =  null;
export class HuggingFace {

    public static async instance() {
        try {
            const c  =  await pipeline('feature-extraction',
                'Xenova/all-MiniLM-L6-v2',{
                    device: 'cpu',
                    dtype: 'q8',
                });
            _class = c;
            return c;
        } catch (err: any) {
            throw err;
        }
    }

    public static async embeddings(_class: any, content: string|string[]) {
        try {
            // basta il blocco dei chunks insieme
            if(!Array.isArray(content)) content =[content]
            const response = await _class(content, {
                pooling: 'mean',
                normalize: true
            })
            return response.tolist();
        } catch (err: any) {
            throw err;
        }
    }


}