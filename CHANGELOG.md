# Changelog

All notable changes to the Multi-Tab Summarizer extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2025-08-22

### Removed
- **Claude Opus 4.1 Support**: Removed non-multimodal Claude Opus 4.1 model option
  - Updated UI to remove Opus 4.1 from model selection dropdown
  - Updated code to remove Opus 4.1 from available models list
  - Updated documentation to reflect current supported models

## [2.2.0] - 2025-08-22

### Added
- **Anthropic Claude API Support**: Full integration with latest Claude models
  - Support for Claude Sonnet 4 (Latest), Claude Haiku 3.5 (Fast)
  - Legacy support for Claude 3.5 Sonnet and Claude 3 Opus models
  - Image analysis capability using screenshots for enhanced understanding
  - Fixed screenshot media type detection for proper image processing
  - JSON response parsing with fallback to raw content
- **Perplexity Sonar API Support**: Integration with Perplexity AI models
  - Support for Sonar (Latest) and Sonar Pro (Advanced) models
  - Real-time web access capabilities for up-to-date information
  - Structured JSON response format for consistent summaries
- **Multi-Provider Architecture**: Unified interface supporting 4 AI providers
  - OpenAI (GPT models)
  - Anthropic Claude (all Claude 3 and 3.5 models)
  - Perplexity (Sonar models)
  - Ollama (local models)
- **Enhanced Provider UI**: Improved provider selection interface
  - Dedicated API key sections for each provider
  - Model selection dropdowns for Claude and Perplexity
  - Provider-specific configuration options
  - Better visual separation of provider settings

### Changed
- **Complete UI Redesign**: Rebuilt popup interface for multi-provider support
  - Provider toggle buttons for easy switching
  - Separate configuration sections for each provider
  - Improved API key visibility toggles
  - Better responsive design and layout
- **Enhanced Security**: Improved API key handling
  - Provider-specific storage keys
  - Secure local storage for all API keys
  - Better error handling for authentication failures
- **Updated Ollama Instructions**: Enhanced setup guidance
  - Clear CORS configuration requirements
  - Specific chrome-extension origin instructions
  - Troubleshooting tips for common issues

### Fixed
- **State Management**: Improved provider state persistence
- **Error Handling**: Better error messages for API failures
- **UI Consistency**: Unified design across all provider sections

### Technical Improvements
- Added claude-handler.js for Anthropic API integration
- Added perplexity-handler.js for Perplexity API integration
- Updated background.js to support all four providers
- Enhanced error handling and logging across all providers
- Improved API response parsing with fallback mechanisms

## [2.1.0] - 2025-08-22

### Added
- **Test Background Service Button**: Small diagnostic button in bottom-left corner for testing connectivity
- **Ollama Helper Script**: `start-ollama.sh` for easy Ollama server configuration with proper CORS settings

### Changed
- **Ollama API URLs**: Updated all endpoints to use `127.0.0.1` instead of `localhost` for better compatibility
- **Origin Headers**: Removed manual Origin header setting (Chrome handles automatically)
- **Test Button Design**: Moved to bottom-left corner with icon-only design for minimal UI impact

### Fixed
- **Ollama 403 Forbidden Errors**: Resolved CORS issues by:
  - Using correct URL format (127.0.0.1)
  - Removing manual Origin headers that conflicted with Chrome's security
  - Ensuring proper OLLAMA_ORIGINS configuration
- **GET vs POST Consistency**: Fixed issue where GET requests worked but POST requests failed

### Documentation
- Consolidated setup instructions into single README
- Added clear Ollama configuration requirements
- Removed temporary debugging documentation files
- Updated troubleshooting section with 403 error solutions

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

## [1.0.0] - 2025-08-14

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