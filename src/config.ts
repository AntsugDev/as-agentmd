import Conf from 'conf';
import {AgentConfig, ProvidersInt} from "./interface/myInterface.js";
import dayjs from "dayjs";

const schemaDefaults: AgentConfig = {
    activeProvider: 'gemini',
    modelSelected:null,
    lastUpdated: dayjs().format('YYYYMMDD'),
    providers: {
        "gemini":null,
        "ollama":null,
        "openai": null
    }
};
export const configStore = new Conf<AgentConfig>({
    projectName: 'agentmd',
    defaults: schemaDefaults
});

export const providers = (): string[] => {
    if (configStore) {
        const p = configStore.get('providers')
       return p ? Object.keys(p) : []
    }
    return []
}

