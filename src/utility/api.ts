import axios, {AxiosHeaders, AxiosRequestConfig} from "axios";

export interface Params {
    url: string,
    method: 'GET' | 'POST' | string,
    payload: any | null,
    headers: AxiosHeaders | null,
    apiKey: string | null
}

export const callbackApi: Promise<T | T[] | null> = (D: Params) => {
    return new Promise<T | T[] | null>(async (resolve, reject) => {
        try {
            const config: AxiosRequestConfig = {
                url: D.url,
                method: D.url
            }
            if (D.payload)
                config.data = D.payload
            const response = await axios.request(config)
            if (response) {
                resolve(response)
            } else reject(response)
        } catch (e) {
            reject(e)
        }
    })
}