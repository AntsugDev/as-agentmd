import axios, {AxiosHeaders, type AxiosRequestConfig} from "axios";
import {inject} from "vue";

export interface Payload {
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: any | null,
    headers: Map<string, any> | null,
    queryString: any | null
}

const isSession = (url: string): boolean => {
    return url.toString() === 'session';
}

export const api = async (p: Payload): Promise<any | null> => {
    return new Promise(async (resolve, reject) => {
        try {
            let session = sessionStorage.getItem('apikey')
            let config: AxiosRequestConfig = {
                baseURL: 'http://localhost:1010/api',
                url: p.url,
                method: p.method
            }
            const h: AxiosHeaders = new AxiosHeaders();
            const sCheck = isSession(p.url)
            if (!sCheck && session) {
                h.set('x-api-key', session)
            }

            if (p.headers)
                p.headers.forEach((e, i) => {
                    h.set(i, e)
                })
            config.headers = h
            if (p.queryString)
                config.params = p.queryString
            if (p.body)
                config.data = p.body

            const response = await axios.request(config)
            if (response) {
                if (sCheck) {
                    sessionStorage.setItem('apikey', response?.data?.apiKey)
                    resolve(true)
                }
                resolve(response)
            }
        } catch (err: any) {
            console.log(err)
            const snack = inject('snack')
            if (snack) {
                let m = null;
                if (err?.response?.data?.error)
                    m = err.response.data.error
                else
                    m = err.toString()
                snack.value = {
                    view: true, msg: m, error: true
                }
            }
            reject(false)
        }


    })
}