# AgentMD 🤖📄

> A lightweight, multi-provider CLI agent for prompt automation, context engineering, and local/cloud LLM orchestration.

**AgentMD** is a developer-friendly command-line tool designed to seamlessly manage, inspect, and execute AI prompts using your preferred providers (Google Gemini, OpenAI, Anthropic, or local models via Ollama).

---

## ✨ Features

- 🔐 **Secure Configuration**: API keys are stored safely in the user home directory—never in the project repo, preventing accidental Git commits.
- 🔄 **Automatic Model Sync**: Background lazy-sync (or manual force sync) fetches live models, token limits, and specs every 30 days.
- 🌐 **Multi-Provider Support**:
    - **Google Gemini** (REST API integration with detailed token bounds & descriptions)
    - **OpenAI** (ChatGPT models)
    - **Anthropic** (Claude series)
    - **Ollama** (Local offline LLMs running on `localhost:11434`)
- 📊 **Detailed Model Inspection**: View input context limits (Context Window), max output bounds, and model descriptions directly from your terminal.
- 🛠️ **Developer-Ready Architecture**: Built with TypeScript, Commander.js, and clean adapter-based design.

---

## 📋 Prerequisites

Before installing, ensure you have the following installed on your system:

- **Node.js**: `v22.0.0` or higher (recommended: `v22.x` LTS)
- **npm**: `v10.0.0` or higher
- **Ollama** *(optional for local offline LLMs)*:
    - Download and install Ollama from [ollama.com](https://ollama.com)
    - Once installed, pull a lightweight model (e.g., `llama3.2:1b` or `llama3.2:3b`):
      ```bash
      ollama pull llama3.2:1b
      ```

Check your installed Node.js version:
```bash
node -v
```

## Installation

```bash
git clone https://github.com/AntsugDev/as-agentmd.git
cd agentmd
npm install
npm run build
npm link
agentmd --version
```

## ⚙️ Configuration

### 🔑 Get API Keys
- Google Gemini (Free Tier available):
   1. Visit Google AI Studio https://aistudio.google.com/ .
   2. Log in with your Google account and click "Get API key" -> "Create API key".
   3. Copy your API key (starts with AIzaSy...).

### 💾 Save Credentials

Save your API keys securely to your machine's local configuration path (~/.config/agentmd-nodejs/config.json):

```bash
# Set Google Gemini API Key
agentmd config set-key gemini AIzaSyYourApiKeyHere

# Set OpenAI API Key (optional)
agentmd config set-key openai sk-YourOpenAiApiKeyHere

# Set Anthropic API Key (optional)
agentmd config set-key anthropic sk-ant-YourAnthropicApiKeyHere
```

### 🔍 View Current Configuration

Inspect saved providers and active configurations:

```bash
agentmd show-config
```

## 🤖 Managing Models

### Synchronize Models Live
Fetch the latest available models and specifications from all configured providers:
```bash
agentmd sync-models
```

### List Available Models & Specs
Inspect available models, input context limits, maximum output limits, and descriptions:
```bash
# List Gemini models (default)
agentmd list-models

# List local Ollama models
agentmd list-models --provider ollama

# List OpenAI models
agentmd list-models --provider openai
```
**Example Output:**

```
🤖 Available models for [GEMINI]:

📌 gemini-2.5-flash (Default ⭐)
   └─ Fast and versatile model for high-frequency tasks.
   └─ 📥 Max Input Context:  1,048,576 token
   └─ 📤 Max Output Response: 65,536 token

📌 gemini-2.5-pro
   └─ Complex reasoning and deep code refactoring model.
   └─ 📥 Max Input Context:  2,097,152 token
   └─ 📤 Max Output Response: 65,536 token
```



