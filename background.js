// Background service worker for Multi-Tab Summarizer

// Import error handling utilities and API handlers
importScripts('error-handler.js');
importScripts('gpt5-handler.js');
importScripts('ollama-handler.js');
// Debug script removed to avoid service worker issues

// Store summaries per window
let summaryCacheByWindow = {};
let isProcessingByWindow = {};

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Multi-Tab Summarizer installed');
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startSummarization':
      handleStartSummarization(message.config);
      sendResponse({ success: true });
      break;
    
    case 'clearSummaries':
      handleClearSummaries();
      sendResponse({ success: true });
      break;
    
    case 'captureScreenshot':
      handleCaptureScreenshot(sender.tab.id, message.tabInfo).then(sendResponse);
      return true; // Keep message channel open
    
    case 'switchToTab':
      chrome.tabs.update(message.tabId, { active: true });
      sendResponse({ success: true });
      break;
    
    case 'hideSidebar':
      hideSidebarInAllTabs();
      sendResponse({ success: true });
      break;
      
    case 'getWindowId':
      chrome.tabs.get(sender.tab.id, (tab) => {
        sendResponse({ windowId: tab.windowId });
      });
      return true; // Keep message channel open
  }
});

async function handleStartSummarization(config) {
  // Get current window ID
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const windowId = currentTab.windowId;
  
  if (isProcessingByWindow[windowId]) {
    console.log(`Summarization already in progress for window ${windowId}`);
    return;
  }

  isProcessingByWindow[windowId] = true;
  summaryCacheByWindow[windowId] = {};

  try {
    // Get all tabs in current window
    const tabs = await chrome.tabs.query({ windowId: windowId });
    
    console.log(`Starting summarization for ${tabs.length} tabs with provider: ${config.provider}`);
    
    // Show sidebar with loading state in all tabs
    for (const tab of tabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        continue;
      }
      
      try {
        // First try to send message to existing content script
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showSidebar',
          summaries: {}
        });
      } catch (error) {
        console.log(`Content script not loaded in tab ${tab.id}, injecting now...`);
        
        // Inject content script and CSS if not already loaded
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            files: ['sidebar.css']
          });
          
          // Wait a bit for scripts to initialize
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Now show sidebar
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showSidebar',
            summaries: {}
          });
          
          console.log(`Successfully injected and showed sidebar in tab ${tab.id}`);
        } catch (injectError) {
          console.error(`Failed to inject into tab ${tab.id}:`, injectError);
        }
      }
    }

    // Process tabs sequentially to avoid screenshot rate limits
    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      
      // Process one tab at a time
      await processSingleTab(tab, config, windowId);
      
      // Update sidebar after each tab
      await updateAllSidebars(windowId);
      
      // Small delay between tabs to respect rate limits
      if (i < tabs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // Save summaries to storage with window ID
    await chrome.storage.local.set({ 
      [`tabSummaries_${windowId}`]: summaryCacheByWindow[windowId] 
    });
    
    console.log(`Summarization complete for window ${windowId}`);
    
  } catch (error) {
    console.error('Error during summarization:', error);
  } finally {
    isProcessingByWindow[windowId] = false;
  }
}

async function processSingleTab(tab, config, windowId) {
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    console.log(`Skipping system tab: ${tab.url}`);
    return;
  }

  try {
    console.log(`Processing tab: ${tab.title}`);
    
    // Initialize summary object in window-specific cache
    summaryCacheByWindow[windowId][tab.id] = {
      tabId: tab.id,
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl,
      summary: null,
      keyPoints: [],
      error: null
    };

    // Capture page content and screenshot
    let pageData;
    try {
      pageData = await chrome.tabs.sendMessage(tab.id, { action: 'capturePage' });
    } catch (error) {
      console.log(`Could not capture page data for tab ${tab.id}, using tab info`);
      pageData = {
        title: tab.title,
        url: tab.url,
        textContent: '',
        screenshot: null
      };
    }

    // Capture screenshot with rate limit protection
    let screenshot = null;
    try {
      // Add delay to respect Chrome's screenshot rate limit (2 per second)
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Switch to the tab briefly to capture screenshot
      const originalActiveTab = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.update(tab.id, { active: true });
      
      // Small delay to ensure tab is loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
        quality: 80
      });
      
      // Switch back to original tab
      if (originalActiveTab[0]) {
        await chrome.tabs.update(originalActiveTab[0].id, { active: true });
      }
    } catch (error) {
      console.error(`Error capturing screenshot for tab ${tab.id}:`, error);
      // Continue without screenshot rather than failing
    }

    // Generate summary using selected provider
    let summaryResult;
    console.log('Using provider:', config.provider, 'with config:', JSON.stringify(config));
    
    try {
      if (config.provider === 'ollama') {
        console.log('Calling Ollama with model:', config.model);
        summaryResult = await generateSummaryWithOllama(
          pageData.textContent || tab.title,
          screenshot,
          tab.title,
          tab.url,
          config.model
        );
      } else if (config.provider === 'openai') {
        console.log('Calling GPT-5 with API key:', config.apiKey ? 'provided' : 'missing');
        summaryResult = await generateSummaryWithGPT5(
          pageData.textContent || tab.title,
          screenshot,
          tab.title,
          tab.url,
          config.apiKey
        );
      } else {
        console.error('Unknown provider:', config.provider);
        summaryResult = {
          summary: null,
          keyPoints: [],
          error: `Unknown provider: ${config.provider}`
        };
      }
    } catch (providerError) {
      console.error(`Error with ${config.provider}:`, providerError);
      summaryResult = {
        summary: null,
        keyPoints: [],
        error: providerError.message
      };
    }

    // Update cache with results
    summaryCacheByWindow[windowId][tab.id] = {
      ...summaryCacheByWindow[windowId][tab.id],
      summary: summaryResult.summary,
      keyPoints: summaryResult.keyPoints || [],
      error: summaryResult.error
    };

    console.log(`Completed summary for: ${tab.title}`);

  } catch (error) {
    console.error(`Error processing tab ${tab.id}:`, error);
    summaryCacheByWindow[windowId][tab.id] = {
      ...summaryCacheByWindow[windowId][tab.id],
      error: error.message
    };
  }
}

// generateSummaryWithGPT5 function is now imported from gpt5-handler.js

async function handleCaptureScreenshot(tabId, tabInfo) {
  try {
    const screenshot = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 80
    });
    
    return { screenshot };
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return { screenshot: null };
  }
}

async function updateAllSidebars(windowId) {
  try {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    
    for (const tab of tabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        continue;
      }
      
      try {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateSidebar',
          summaries: summaryCacheByWindow[windowId] || {}
        });
      } catch (error) {
        // Tab might not have content script injected
        console.log(`Could not update sidebar in tab ${tab.id}`);
      }
    }
  } catch (error) {
    console.error('Error updating sidebars:', error);
  }
}

async function hideSidebarInAllTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const windowId = tabs[0]?.windowId;
    
    for (const tab of tabs) {
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        continue;
      }
      
      try {
        await chrome.tabs.sendMessage(tab.id, { action: 'hideSidebar' });
      } catch (error) {
        console.log(`Could not hide sidebar in tab ${tab.id}`);
      }
    }
    
    // Clear stored summaries and state for this window only
    if (windowId) {
      await chrome.storage.local.remove([`tabSummaries_${windowId}`, `sidebarState_${windowId}`]);
      delete summaryCacheByWindow[windowId];
    }
    
  } catch (error) {
    console.error('Error hiding sidebars:', error);
  }
}

async function handleClearSummaries() {
  try {
    await hideSidebarInAllTabs();
    console.log('Summaries cleared');
  } catch (error) {
    console.error('Error clearing summaries:', error);
  }
}

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Check if we have summaries to restore for this window
    const windowId = tab.windowId;
    const result = await chrome.storage.local.get([`tabSummaries_${windowId}`, `sidebarState_${windowId}`]);
    const summaries = result[`tabSummaries_${windowId}`];
    const sidebarState = result[`sidebarState_${windowId}`];
    
    if (summaries && Object.keys(summaries).length > 0 && sidebarState?.isVisible) {
      // Inject content script first if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: tabId },
          files: ['sidebar.css']
        });
      } catch (error) {
        // Script might already be injected
      }
      
      // Small delay to ensure scripts are loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        await chrome.tabs.sendMessage(tabId, {
          action: 'showSidebar',
          summaries: summaries
        });
      } catch (error) {
        console.log(`Could not show sidebar in tab ${tabId}:`, error);
      }
    }
  }
});

// Clean up when tabs are closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  // Find which window this tab belonged to
  for (const [windowId, cache] of Object.entries(summaryCacheByWindow)) {
    if (cache[tabId]) {
      delete cache[tabId];
      await chrome.storage.local.set({ [`tabSummaries_${windowId}`]: cache });
      await updateAllSidebars(parseInt(windowId));
      break;
    }
  }
});