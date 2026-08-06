import axios, {AxiosHeaders, AxiosRequestConfig} from "axios";

export interface Params {
    url: string,
    method: 'GET' | 'POST' | string,
    payload: any | null,
    headers: AxiosHeaders | null,
    apiKey: string | null
}

// @ts-ignore
export const callbackApi: Promise<any| any[] | null> = (D: Params) => {
    return new Promise<any | any[]| null>(async (resolve, reject) => {
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