# Privacy Policy for Multi-Tab Summarizer

**Effective Date:** August 22, 2025  
**Last Updated:** August 22, 2025

## Overview

Multi-Tab Summarizer is a Chrome extension that generates AI-powered summaries of your open browser tabs. This privacy policy explains how we handle your data in compliance with Chrome Web Store Developer Program Policies.

## Single Purpose

Multi-Tab Summarizer has a single, narrow purpose: to generate AI-powered summaries of all open browser tabs to help users quickly understand and manage their browsing content.

## Data Collection and Handling

### What Information We Collect

**We do NOT collect, store, or transmit any user data to our servers.** All data handling occurs locally in your browser or directly between your browser and your chosen AI provider.

The extension processes the following data locally:

- **Tab Information**: URLs, titles, and text content of open browser tabs
- **Screenshots**: Visual captures of web pages for enhanced AI analysis (Claude and OpenAI only)
- **User Preferences**: Your selected AI provider, model choices, and extension settings
- **API Keys**: Authentication credentials for AI services (stored locally only)

### How We Handle Your Data

1. **Local Processing**: All data extraction and processing happens locally in your browser
2. **Direct API Communication**: When generating summaries, your browser sends data directly to your chosen AI provider
3. **No Server Storage**: We do not operate servers that store, process, or have access to your data
4. **User Control**: You can clear all stored data using the extension's "Clear Summaries" button

### Data Storage

- **Local Storage Only**: All preferences and API keys are stored locally using Chrome's storage API
- **No Cloud Storage**: We do not store any user data in cloud services or remote databases
- **User-Controlled Deletion**: Users can delete all stored data at any time

## Third-Party AI Providers

When you use the extension, your browser communicates directly with your chosen AI provider:

### OpenAI (api.openai.com)
- **Data Sent**: Tab content, screenshots, and your prompts
- **Purpose**: Generate text summaries using GPT models
- **Privacy**: Subject to [OpenAI's Privacy Policy](https://openai.com/privacy/)

### Anthropic Claude (api.anthropic.com)
- **Data Sent**: Tab content, screenshots, and your prompts
- **Purpose**: Generate text summaries using Claude models
- **Privacy**: Subject to [Anthropic's Privacy Policy](https://www.anthropic.com/privacy)

### Perplexity (api.perplexity.ai)
- **Data Sent**: Tab content and your prompts
- **Purpose**: Generate text summaries using Sonar models
- **Privacy**: Subject to [Perplexity's Privacy Policy](https://www.perplexity.ai/privacy)

### Local Ollama (localhost/127.0.0.1)
- **Data Sent**: Tab content and your prompts to your local machine only
- **Purpose**: Generate text summaries using local AI models
- **Privacy**: Completely private - data never leaves your device

## Permissions Justification

### Required Permissions

- **`activeTab`**: Access current tab content for summarization
- **`declarativeContent`**: Show extension icon on supported pages only
- **`host_permissions` (`<all_urls>`)**: Access all websites for content extraction and API communication
- **`scripting`**: Inject content scripts to extract page content and display summaries
- **`storage`**: Store user preferences and API keys locally
- **`tabs`**: Access tab information (URLs, titles) for multi-tab summarization
- **`webNavigation`**: Maintain summary functionality during page navigation

Each permission is used solely for the extension's core functionality of generating tab summaries.

## Data Security

- **Encryption**: All API communications use HTTPS encryption
- **Local Storage**: Data stored locally using Chrome's secure storage APIs
- **No Transmission to Our Servers**: Your data never passes through our systems
- **User Control**: Complete control over data retention and deletion

## Limited Use Compliance

This extension complies with Chrome Web Store Limited Use requirements:

1. **Allowed Use**: Personal and sensitive user data is used only to provide the single purpose of tab summarization
2. **Allowed Transfer**: Data is only transferred directly to user-chosen AI providers for summarization
3. **Prohibited Advertising**: We do not use user data for advertising, targeting, or monetization
4. **Prohibited Human Access**: No humans read your data except as required for technical support with explicit consent

## User Rights and Control

- **Access**: View all locally stored data through Chrome's extension storage
- **Deletion**: Clear all data using the extension's "Clear Summaries" button
- **Choice**: Select which AI provider to use, including local-only options
- **Transparency**: All code is open source and available for review

## No Data Collection Statement

**We do not collect, analyze, or monetize your personal information.** The extension operates as a local tool that facilitates direct communication between your browser and AI services.

## Changes to This Policy

We will update this privacy policy if our data practices change. Updates will be posted in the extension and on our GitHub repository.

## Contact Information

**Developer:** Dr. Robert Li  

**Email:** dr.robert.li.au@gmail.com

**Support:** [\[GitHub repository URL\]](https://github.com/dr-robert-li/multitab-summariser/)

## Compliance Certifications

This extension:
- ✅ Handles user data securely with encryption
- ✅ Uses minimum required permissions
- ✅ Provides transparent data practices
- ✅ Offers user control over data
- ✅ Complies with Chrome Web Store Developer Program Policies

---

*This privacy policy is designed to comply with Chrome Web Store Developer Program Policies and provide complete transparency about data handling practices.*