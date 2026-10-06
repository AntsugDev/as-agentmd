import axios, {AxiosHeaders, AxiosRequestConfig, AxiosResponse} from "axios";

export interface Params {
    url: string,
    method: 'GET' | 'POST' | string,
    payload?: any | null,
    headers?: AxiosHeaders | null,
    apiKey?: string | null
}

// @ts-ignore
export const callbackApi = (D: Params): Promise<any | any[] | null | boolean | undefined> => {
    return new Promise<any | any[] | null | boolean | undefined>(async (resolve, reject) => {
        try {
            const config: AxiosRequestConfig = {
                url: D.url.trim(),
                method: D.method.trim(),
            }
            if(D.headers){
                config.headers = D.headers
            }
            if (D.payload)
                config.data = D.payload
            const response: AxiosResponse = await axios.request(config)
            if (response) {
                resolve(response)
            } else reject(response)
        } catch (e) {
            reject(e)
        }
    })
}