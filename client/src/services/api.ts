import axios, {AxiosHeaders, type AxiosRequestConfig} from "axios";
import {inject} from "vue";

export interface Payload {
    url: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body: any | null,
    headers: Map<string, any> | null,
    queryString: any | null,
    responseType: null | 'blob'
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
            console.log('Api error', err)
            reject(err)
        }


    })
}