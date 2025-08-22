# Changelog

All notable changes to the Multi-Tab Summarizer extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-08-22

### Added
- **Individual Tab Selection**: New popup interface allowing users to select specific tabs for summarization
  - Select/deselect individual tabs with checkboxes
  - Master "Select All" checkbox with indeterminate state support
  - Visual tab list showing favicons, titles, and URLs
  - Tab selection state persistence during popup reopening
- **Semantic Grouping**: AI-powered intelligent categorization of tabs before summarization
  - Optional semantic grouping checkbox in popup settings
  - AI analysis using the selected summarization provider (OpenAI, Claude, Perplexity, Ollama)
  - Automatic categorization into 3-6 meaningful groups based on content and purpose
  - Fallback to rule-based grouping if AI categorization fails
- **Enhanced Sidebar with Grouping**: Organized display of summaries in semantic categories
  - Collapsible group headers with category names and descriptions
  - Group-level progress indicators showing completion status
  - Individual group status: "Pending", "In Progress (X/Y)", "Complete", "Failed", "Partial"
  - Color-coded group headers by category (Social Media, News, E-commerce, Development, etc.)
- **Improved Progress Tracking**: Real-time progress indicators throughout the summarization process
  - Accurate "X/Y tabs summarized" format instead of just completion counts
  - Progress bar showing percentage completion with smooth animations
  - Status indicators for overall progress and individual groups
  - Loading states during initial processing phases

### Changed
- **Processing Order Optimization**: Two-phase processing approach for better reliability
  - Phase 1: Capture all screenshots and page content upfront
  - Phase 2: Sequential AI processing of captured data
  - Return to original tab after data capture phase completes
  - Improved rate limiting and permission handling
- **Enhanced Error Handling**: Comprehensive error management for protected tabs
  - Robust filtering of system tabs (chrome://, edge://, about:, extensions)
  - Graceful handling of tabs that cannot be scripted due to browser policies
  - Prevention of permission errors during screenshot capture
  - Better error messages and fallback behavior
- **Sidebar State Synchronization**: Improved state management across browser tabs
  - Window-wide sidebar state instead of per-tab state
  - Closing sidebar in one tab closes it in all tabs within the same window
  - Consistent state restoration when switching between tabs
  - Preserved expansion/collapse state for both individual summaries and groups

### Fixed
- **Permission Errors**: Resolved "ExtensionsSettings policy" and "activeTab permission not in effect" errors
  - Added comprehensive `isScriptableTab()` helper function
  - Consistent filtering applied across all tab operations
  - Proper handling of file:// protocols and system pages
- **Progress Counter Issues**: Fixed "X/X" vs "X/Y" display problems in progress indicators
  - Accurate total tab counting throughout the processing pipeline
  - Consistent `totalSelectedTabs` parameter passing through all function calls
  - Proper progress calculation even when no summaries are completed yet
- **Semantic Grouping Reliability**: Resolved intermittent grouping functionality failures
  - Fixed parameter passing through the entire processing chain
  - Proper error handling and fallback when AI grouping fails
  - Maintained group information throughout sidebar updates
- **UI State Consistency**: Enhanced user interface reliability and responsiveness
  - Fixed progress bar disappearing when showing "Processing 0 of X tabs"
  - Improved loading states for different processing phases
  - Better handling of empty summaries during initialization

### Technical Improvements
- **Unified Tab Filtering**: Consolidated tab validation logic across all components
- **Enhanced Background Script**: Improved error handling and processing flow
- **Optimized Content Script**: Better progress tracking and state management
- **Semantic Analysis Integration**: AI-powered grouping using existing API providers
- **Code Architecture**: Cleaner separation of concerns and better error boundaries

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