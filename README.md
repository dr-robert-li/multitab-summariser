# Multi-Tab Summarizer

Generate AI-powered summaries of all your open tabs using multiple AI providers including OpenAI, Claude, Perplexity, or local Ollama models.

## Features

- 🤖 **Multi-AI Provider Support**: Works with OpenAI (GPT models), Anthropic Claude, Perplexity Sonar, or local Ollama models
- 📑 **Multi-tab Processing**: Summarizes all open tabs at once
- 🖼️ **Visual Context**: Captures screenshots for enhanced understanding (Claude and OpenAI)
- 🎯 **Key Points Extraction**: Highlights important information from each page
- 💾 **State Persistence**: Maintains summaries when switching tabs
- 🔒 **Privacy Focused**: Local Ollama option means your data never leaves your machine
- 🌐 **Real-time Web Access**: Perplexity integration provides up-to-date information

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension directory

## Setup

### Option 1: OpenAI (Cloud-based)

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Open the extension popup
3. Select "OpenAI" provider
4. Enter your API key
5. Start summarizing!

### Option 2: Anthropic Claude (Cloud-based)

1. Get an Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
2. Open the extension popup
3. Select "Claude" provider
4. Enter your API key
5. Choose your preferred Claude model (Sonnet 4 recommended for latest features)
6. Start summarizing!

### Option 3: Perplexity Sonar (Cloud-based)

1. Get a Perplexity API key from [perplexity.ai/settings/api](https://perplexity.ai/settings/api)
2. Open the extension popup
3. Select "Perplexity" provider
4. Enter your API key
5. Choose your preferred Sonar model
6. Start summarizing!

### Option 4: Ollama (Local/Private)

1. **Install Ollama**: Follow instructions at [ollama.ai](https://ollama.ai)

2. **Pull a model** (recommended: `granite3.3` for speed or `mistral-small3.2` for quality):
   ```bash
   ollama pull granite3.3:latest
   ```

3. **Get your Chrome extension ID**:
   - Go to `chrome://extensions/`
   - Find "Multi-Tab Summarizer" in the list
   - Copy the ID shown under the extension name (looks like: `abcdefghijklmnop...`)

4. **Start Ollama with Chrome extension support**:
   ```bash
   OLLAMA_ORIGINS="chrome-extension://YOUR_EXTENSION_ID_HERE" ollama serve
   ```
   
   Replace `YOUR_EXTENSION_ID_HERE` with the ID you copied in step 3.
   
   Example:
   ```bash
   OLLAMA_ORIGINS="chrome-extension://ckeegdgmbadeeplemigcgaojkaediein" ollama serve
   ```
   
   **Alternative**: Use the provided helper script:
   ```bash
   ./start-ollama.sh YOUR_EXTENSION_ID_HERE
   ```

5. **Use the extension**:
   - Select "Ollama (Local)" provider
   - Choose your model from the dropdown
   - Start summarizing!

## Usage

1. Open multiple tabs with content you want to summarize
2. Click the extension icon in Chrome toolbar
3. Choose your AI provider (OpenAI, Claude, Perplexity, or Ollama)
4. Configure API key or select model
5. Click "Start Summary"
6. View summaries in the sidebar that appears on each tab

## AI Provider Comparison

| Provider | Models Available | Screenshot Support | Real-time Web Access | Privacy |
|----------|-----------------|-------------------|---------------------|---------|
| **OpenAI** | GPT-5 | ✅ Yes | ❌ No | Cloud-based |
| **Claude** | Sonnet 4, Haiku 3.5 | ✅ Yes | ❌ No | Cloud-based |
| **Perplexity** | Sonar, Sonar Pro | ❌ No | ✅ Yes | Cloud-based |
| **Ollama** | Any local model | ❌ No | ❌ No | 🔒 Fully local |

## Troubleshooting

### Ollama "403 Forbidden" Error

This means Ollama needs to be configured to allow Chrome extension access:

1. **Get your extension ID** (see setup instructions above)
2. **Stop any existing Ollama processes**:
   ```bash
   pkill -f ollama
   ```
3. **Start with proper CORS configuration**:
   ```bash
   OLLAMA_ORIGINS="chrome-extension://YOUR_EXTENSION_ID_HERE" ollama serve
   ```
   
   Replace `YOUR_EXTENSION_ID_HERE` with your actual extension ID from `chrome://extensions/`

### "No models found" with Ollama

1. Make sure Ollama is running: `ollama serve`
2. Pull at least one model: `ollama pull granite3.3`
3. Click the refresh button in the extension

## Privacy & Security

- **Local Storage**: API keys are stored only in your browser
- **No Data Collection**: No usage data is collected
- **Direct API Calls**: Communicates directly with AI providers
- **Ollama Option**: Keep all data local with Ollama

## Version

Current version: **2.2.1** (August 22, 2025)

See [CHANGELOG.md](CHANGELOG.md) for detailed version history and release notes.

## License

MIT License - Copyright (c) 2025 Dr. Robert Li

## Support

For issues or feedback, please visit the project repository at [https://github.com/dr-robert-li/multitab-summariser](https://github.com/dr-robert-li/multitab-summariser).