# Proxy Solution for Ollama Chrome Extension

## The Problem
Chrome extensions have strict security restrictions that prevent direct access to localhost APIs, even with CORS disabled.

## The Solution
I've created a simple HTTP proxy server that sits between the Chrome extension and Ollama. This proxy:
1. Accepts requests from the Chrome extension on port 3001
2. Forwards them to Ollama on port 11434
3. Returns responses with proper CORS headers

## Setup Instructions

### 1. Start Ollama (any configuration)
```bash
ollama serve
```
(You can use any OLLAMA_ORIGINS setting or default)

### 2. Start the Proxy Server
In a new terminal, run:
```bash
cd /Users/robertli/Desktop/local-projects/multi-tab-summariser
node proxy-server.js
```

You should see:
```
✅ Ollama proxy server running on http://localhost:3001
Proxying requests to http://127.0.0.1:11434
```

### 3. Reload Chrome Extension
- Go to chrome://extensions/
- Click refresh on "Multi-Tab Summarizer"

### 4. Test Summarization
- Select Ollama provider and a model
- Click "Start Summary"
- Check logs for successful HTTP 200 responses

## Expected Logs
With the proxy working, you should see:
```
getOllamaModels: Making fetch request to http://localhost:3001/api/tags
generateSummaryWithOllama: Sending request to Ollama proxy at http://localhost:3001/api/generate
generateSummaryWithOllama: Response status: 200 statusText: OK
```

## Why This Works
- Chrome extensions can access localhost HTTP servers
- Our proxy has proper CORS headers
- The proxy forwards requests to Ollama seamlessly
- No Chrome extension security restrictions

Try this setup and let me know if the 403 errors are resolved!