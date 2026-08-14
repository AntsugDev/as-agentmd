import axios from 'axios'
import type { AiModel, ChatRequest, ChatResponse, UserSettings } from '../types/chat'

const MOCK_DELAY = 450

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 30000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentmd_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

const wait = (ms = MOCK_DELAY) => new Promise((resolve) => window.setTimeout(resolve, ms))

const mockModels: AiModel[] = [
  {
    name: 'openai/gpt-5-mini',
    displayName: 'GPT-5 Mini',
    description: 'Fast assistant for everyday chat and document workflows.',
    inputTokenLimit: 128000,
    outputTokenLimit: 16000,
    version: '2026-08',
    provider: 'OpenAI',
  },
  {
    name: 'anthropic/claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    description: 'Balanced model for reasoning and structured writing.',
    inputTokenLimit: 200000,
    outputTokenLimit: 32000,
    version: '2026-05',
    provider: 'Anthropic',
  },
  {
    name: 'google/gemini-2.5-pro',
    displayName: 'Gemini 2.5 Pro',
    description: 'Large context model for multimodal analysis.',
    inputTokenLimit: 1000000,
    outputTokenLimit: 64000,
    version: '2026-06',
    provider: 'Google',
  },
]

let mockSettings: UserSettings = {
  modelSelected: 'openai/gpt-5-mini',
  lastUpdated: new Date().toISOString(),
  providers: [
    {
      name: 'OpenAI',
      apiKey: 'sk-live-demo-openai-key',
      models: mockModels.filter((model) => model.provider === 'OpenAI'),
    },
    {
      name: 'Anthropic',
      apiKey: 'sk-ant-demo-anthropic-key',
      models: mockModels.filter((model) => model.provider === 'Anthropic'),
    },
    {
      name: 'Google',
      apiKey: '',
      models: mockModels.filter((model) => model.provider === 'Google'),
    },
  ],
}

export const getModels = async (): Promise<AiModel[]> => {
  await wait()
  return mockModels
}

export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  await wait(700)

  const fileNote = request.file ? ` File ricevuto: ${request.file.name}.` : ''
  return {
    answer: `Risposta fittizia da ${request.model}: ho ricevuto "${request.prompt}".${fileNote}`,
  }
}

export const getSettings = async (): Promise<UserSettings> => {
  await wait()
  return structuredClone(mockSettings)
}

export const updateProviderApiKey = async (providerName: string, apiKey: string): Promise<UserSettings> => {
  await wait()
  mockSettings = {
    ...mockSettings,
    providers: mockSettings.providers.map((provider) =>
      provider.name === providerName ? { ...provider, apiKey } : provider,
    ),
  }
  return structuredClone(mockSettings)
}

export const syncModels = async (): Promise<UserSettings> => {
  await wait(900)
  mockSettings = {
    ...mockSettings,
    lastUpdated: new Date().toISOString(),
  }
  return structuredClone(mockSettings)
}

export const updateDefaultModel = async (modelSelected: string): Promise<UserSettings> => {
  await wait()
  mockSettings = {
    ...mockSettings,
    modelSelected,
  }
  return structuredClone(mockSettings)
}
