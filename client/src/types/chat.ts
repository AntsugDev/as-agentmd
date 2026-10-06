export interface AiModel {
  name: string
  displayName?: string | null
  description?: string | null
  inputTokenLimit?: number | null
  outputTokenLimit?: number | null
  version?: string | null
  provider?: string
}

export interface ProviderConfig {
  name: string
  apiKey: string
  models: AiModel[]
}

export interface UserSettings {
  modelSelected: string
  lastUpdated: string
  providers: ProviderConfig[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  order:number
}

export interface ChatRequest {
  model: string
  prompt: string
  file?: File | null
}

export interface ChatResponse {
  answer: string
}
