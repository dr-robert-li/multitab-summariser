# Multi-Tab Summarizer

**Version:** 1.0.0  
**Date:** August 14, 2025  
**Author:** Dr. Robert Li

A Chrome extension that generates AI-powered summaries of all your open tabs using OpenAI's GPT-5 model with vision capabilities.

## Features

- 📄 **Multi-Tab Analysis**: Summarize all open tabs in your current window
- 🤖 **GPT-5 Integration**: Uses OpenAI's latest model with vision capabilities
- 📷 **Screenshot Analysis**: Captures and analyzes page screenshots along with text content
- 🎨 **Modern UI**: Clean, responsive sidebar design with gradient themes
- 🔒 **Secure**: Your API key is stored locally and never shared
- ⚡ **Real-time**: Updates summaries as you navigate between tabs

## Installation

1. **Download or Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

## Setup

### 1. Get OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 2. Configure Extension

1. Click the extension icon in your Chrome toolbar
2. Paste your OpenAI API key in the input field
3. The key is automatically saved locally in your browser

## Usage

### Basic Usage

1. **Open multiple tabs** with content you want to summarize
2. **Click the extension icon** in your toolbar
3. **Click "Summarize All Tabs"** button
4. **View summaries** in the sidebar that appears on each tab

### Features

- **Current Tab Indicator**: The current tab is highlighted in the sidebar
- **Click to Navigate**: Click any summary to switch to that tab
- **Key Points**: Each summary includes bullet points of main topics
- **Clear Summaries**: Use the "Clear Summaries" button to remove all data

### Tips

- Works best with content-rich pages (articles, documentation, etc.)
- Skips Chrome system pages (`chrome://`) automatically
- Processes tabs in batches to respect API rate limits
- Screenshots are captured at low quality to optimize API usage

## Privacy & Security

- **Local Storage**: API keys are stored only in your local browser storage
- **No Data Collection**: No usage data is collected or transmitted
- **Direct API Calls**: Communicates directly with OpenAI's API
- **Temporary Screenshots**: Screenshots are only used for analysis and not stored

## Troubleshooting

### Common Issues

**Extension not working:**
- Ensure Developer Mode is enabled in Chrome extensions
- Check that all files are present in the extension folder
- Reload the extension after making changes

**API errors:**
- Verify your OpenAI API key is correct and active
- Check your OpenAI account has sufficient credits
- Ensure GPT-5 access is available for your account

**No summaries generated:**
- Check browser console for error messages
- Ensure pages have loaded completely before summarizing
- Try refreshing tabs if content appears blank

**Sidebar not appearing:**
- Check if the page allows content script injection
- Some secure sites may block extensions
- Try on regular websites first

### Browser Console

Open Chrome DevTools (F12) and check the Console tab for detailed error messages.

## Development

### File Structure

```
multi-tab-summariser/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── content.js             # Content script for page interaction
├── sidebar.css            # Sidebar styling
├── background.js          # Service worker for API calls
├── icons/
│   ├── icon.svg          # Source icon file
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
└── README.md             # This file
```

### Local Development

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test your changes

## API Usage & Costs

This extension uses OpenAI's GPT-5 API, which charges based on:
- **Input tokens**: Text content and image analysis
- **Output tokens**: Generated summaries

Typical costs per tab summary:
- Text-only pages: ~$0.001-0.003
- Pages with screenshots: ~$0.005-0.015

The extension optimizes costs by:
- Limiting text content to 3000 characters
- Using low-quality screenshots
- Processing tabs in batches

## License

MIT License

Copyright (c) 2025 Dr. Robert Li

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

For bugs or support, please log them in the issues section of this repository.

**No warranties are provided with this software.**