import {getApi, ProvidersInt, RawGeminiModel} from "../interface/myInterface.js";
import {configStore} from "../config.js";

export class DataUtility {

    protected provider: string;

    constructor(provider: string) {
        this.provider = provider
    }

    private getProvider(): ProvidersInt | null {
        return configStore.get(`providers.${this.provider}`)
    }

    protected preProviderInstance(apiModel?: getApi | null, apiChat?: getApi | null): void {
        const data: ProvidersInt | null = this.getProvider()
        if (!data)
            configStore.set(`providers.${this.provider}`, {
                apiKey: "",
                models: [],
                api: {
                    get_models: apiModel,
                    get_chat: apiChat
                }

            } as ProvidersInt)
    }

    protected extraApiKey() {
        const data: ProvidersInt | null = this.getProvider()
        if (data && data.apiKey) {
            return data.apiKey
        } else {
            console.warn(`Api key not found for ${this.provider} selected`)
            return;
        }
    }

    protected setModels (models: any){
        const data: ProvidersInt | null = this.getProvider()
        if (data) {
            data.models = models
            configStore.set(`providers.${this.provider}`, data)
        }

    }
    public getModels  ():RawGeminiModel[] | null | undefined {
        const data: ProvidersInt | null = this.getProvider()
        if (data) {
            return data.models
        }
        return [];
    }

    protected clearModels  () {
        let data: ProvidersInt | null = this.getProvider()
        if (data && data.models) {
            data.models = []
            configStore.set(`providers.${this.provider}`, data)
        }
    }

}