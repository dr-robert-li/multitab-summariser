# Changelog

All notable changes to the Multi-Tab Summarizer extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-08-22

### Added
- **Ollama Integration**: Support for local AI models via Ollama
  - No API key required for local model usage
  - Dynamic model selection dropdown
  - Automatic detection of available Ollama models
  - Refresh button to reload model list
- **Provider Selection**: Toggle between OpenAI and Ollama providers
  - Clean UI with provider toggle buttons
  - Settings persistence across sessions
- **Enhanced State Management**: Improved state persistence when switching tabs
  - Sidebar visibility state maintained across tab switches
  - Expanded/collapsed state of individual summaries preserved
  - Per-window state management
  - Automatic restoration when tabs reload or navigate

### Changed
- **UI Improvements**: Redesigned settings interface
  - Separate sections for OpenAI and Ollama configuration
  - Cleaner provider selection interface
  - Better visual feedback for selected provider
- **Error Handling**: More robust error handling
  - Graceful handling of extension context invalidation
  - Better error messages for failed API calls
  - Fallback mechanisms for network failures

### Fixed
- Fixed issue where content scripts would be injected multiple times
- Fixed Set/Array conversion issues with state persistence
- Fixed extension context invalidation errors
- Fixed improper API calls when switching providers
- Fixed state loss when navigating between tabs

### Technical Improvements
- Added debug logging for easier troubleshooting
- Improved manifest permissions for localhost API access
- Better separation of concerns with dedicated handler files
- Prevention of duplicate content script injections

## [1.0.0] - Initial Release

### Features
- Multi-tab summarization using OpenAI GPT models
- Screenshot capture for visual context
- Sidebar interface showing all tab summaries
- Key points extraction for each tab
- Support for GPT-5, GPT-4o, and GPT-4o-mini models
- Secure local storage of API keys
- Clean, modern UI with gradient design
- Tab navigation from summary sidebar
- Collapsible summary sections
- Progress tracking during summarization