import axios, {AxiosHeaders, type AxiosRequestConfig} from "axios";
import {ref} from "vue";

export interface Payload {
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: any | null,
    headers: Map<string, any> | null,
    queryString: any | null,
    responseType: null | 'blob'
}

export const snack = ref<{
    error: boolean,
    msg: string | null,
    view: boolean
}>({
    error: false,
    msg: null,
    view: false
})

const isSession = (url: string): boolean => {
    return url.toString() === 'session';
}

export const api = async (p: Payload): Promise<any | null> => {
    return new Promise(async (resolve, reject) => {
        let session = sessionStorage.getItem('apikey')
        try {
            let config: AxiosRequestConfig = {
                baseURL: 'http://localhost:1010/api',
                url: p.url,
                method: p.method
            }
            if (p.responseType)
                config.responseType = p.responseType
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
            if (p.body) {
                config.data = p.body
            }

            const response = await axios.request(config)
            if (response) {
                if (sCheck) {
                    sessionStorage.setItem('apikey', response?.data?.apiKey)
                    resolve(true)
                }
                resolve(response)
            }
        } catch (err: any) {
            if (session) {
                const errorMsg = err?.response?.data?.error || err?.message || 'Eccezione API'
                snack.value = {
                    error: true,
                    msg: errorMsg,
                    view: true
                }
            }
            reject(err)
        }
    })
}