import axios, {AxiosHeaders, type AxiosRequestConfig} from "axios";
import {ref} from "vue";

const apiBaseUrl = "http://localhost:1010/api"

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

let sessionPromise: Promise<string> | null = null
let refreshPromise: Promise<string> | null = null

const establishSession = async (): Promise<string> => {
    const response = await axios.get(`${apiBaseUrl}/session`)
    const apiKey = response.data?.apiKey
    if (typeof apiKey !== 'string' || apiKey.length === 0) {
        throw new Error('Session API returned an invalid API key')
    }

    sessionStorage.setItem('apikey', apiKey)
    return apiKey
}

const getSession = (): Promise<string> => {
    if (!sessionPromise) {
        sessionPromise = establishSession().catch((error: unknown) => {
            sessionPromise = null
            throw error
        })
    }
    return sessionPromise
}

const refreshSession = (): Promise<string> => {
    if (!refreshPromise) {
        refreshPromise = establishSession()
            .then((apiKey) => {
                sessionPromise = Promise.resolve(apiKey)
                return apiKey
            })
            .finally(() => {
                refreshPromise = null
            })
    }
    return refreshPromise
}

const createConfig = (p: Payload, apiKey: string): AxiosRequestConfig => {
    const headers = new AxiosHeaders()
    headers.set('x-api-key', apiKey)

    p.headers?.forEach((value, name) => {
        headers.set(name, value)
    })

    return {
        baseURL: apiBaseUrl,
        url: p.url,
        method: p.method,
        headers,
        ...(p.responseType ? { responseType: p.responseType } : {}),
        ...(p.queryString ? { params: p.queryString } : {}),
        ...(p.body ? { data: p.body } : {}),
    }
}

export const api = async (p: Payload): Promise<any | null> => {
    try {
        if (isSession(p.url)) {
            await getSession()
            return true
        }

        const apiKey = await getSession()
        try {
            return await axios.request(createConfig(p, apiKey))
        } catch (error) {
            if (!axios.isAxiosError(error) || error.response?.status !== 401) {
                throw error
            }
            return await axios.request(createConfig(p, await refreshSession()))
        }
    } catch (err: any) {
        if (sessionStorage.getItem('apikey')) {
            const errorMsg = err?.response?.data?.error || err?.message || 'Eccezione API'
            snack.value = {
                error: true,
                msg: errorMsg,
                view: true
            }
        }
        throw err
    }
}