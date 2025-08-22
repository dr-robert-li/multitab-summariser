// Background service worker for Multi-Tab Summarizer

// Import error handling utilities and API handlers
importScripts('error-handler.js');
importScripts('gpt5-handler.js');
importScripts('ollama-handler.js');
importScripts('claude-handler.js');
importScripts('perplexity-handler.js');
importScripts('semantic-grouping.js');
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
      
    case 'hideSidebarFromTab':
      // When a single tab requests to hide the sidebar, hide it in all tabs
      hideSidebarInAllTabs();
      sendResponse({ success: true });
      break;
      
    case 'getWindowId':
      chrome.tabs.get(sender.tab.id, (tab) => {
        sendResponse({ windowId: tab.windowId });
      });
      return true; // Keep message channel open
    
    case 'getOllamaModels':
      console.log('background.js: Received getOllamaModels request');
      getOllamaModels().then(result => {
        console.log('background.js: getOllamaModels completed, sending response:', result?.length || 0, 'models');
        sendResponse(result);
      }).catch(error => {
        console.error('background.js: getOllamaModels failed:', error);
        sendResponse([]);
      });
      return true; // Keep message channel open
    
    case 'test':
      console.log('background.js: Received test message - background script is working!');
      sendResponse({ status: 'ok', message: 'Background script is responding' });
      break;
  }
});

async function handleStartSummarization(config) {
  console.log('background.js: handleStartSummarization called with config:', config);
  
  // Get current window ID and remember the original tab
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const windowId = currentTab.windowId;
  const originalTabId = currentTab.id;
  console.log('background.js: Current window ID:', windowId);
  console.log('background.js: Original tab ID:', originalTabId);
  
  if (isProcessingByWindow[windowId]) {
    console.log(`background.js: Summarization already in progress for window ${windowId}`);
    return;
  }

  isProcessingByWindow[windowId] = true;
  summaryCacheByWindow[windowId] = {};

  try {
    // Get all tabs in current window
    const allTabs = await chrome.tabs.query({ windowId: windowId });
    
    // Helper function to check if tab can be scripted
    const isScriptableTab = (tab) => {
      return !tab.url.startsWith('chrome://') && 
             !tab.url.startsWith('chrome-extension://') &&
             !tab.url.startsWith('edge://') &&
             !tab.url.startsWith('about:') &&
             !tab.url.startsWith('moz-extension://') &&
             !tab.url.startsWith('file://');
    };
    
    // Filter tabs based on selection (if provided) and exclude system tabs
    let tabsToProcess;
    if (config.selectedTabIds && config.selectedTabIds.length > 0) {
      tabsToProcess = allTabs.filter(tab => 
        config.selectedTabIds.includes(tab.id) && isScriptableTab(tab)
      );
    } else {
      tabsToProcess = allTabs.filter(tab => isScriptableTab(tab));
    }
    
    // Store the total count for consistent progress tracking
    const totalSelectedTabs = tabsToProcess.length;
    
    console.log(`Starting summarization for ${totalSelectedTabs} selected tabs with provider: ${config.provider}`);
    
    // Set sidebar state to visible for this window
    const currentSidebarState = await chrome.storage.local.get([`sidebarState_${windowId}`]);
    const sidebarState = currentSidebarState[`sidebarState_${windowId}`] || {};
    const updatedSidebarState = {
      ...sidebarState,
      isVisible: true
    };
    await chrome.storage.local.set({ [`sidebarState_${windowId}`]: updatedSidebarState });
    
    // Show sidebar with loading state in all tabs (not just selected ones)
    for (const tab of allTabs) {
      if (!isScriptableTab(tab)) {
        console.log(`Skipping system/protected tab: ${tab.url}`);
        continue;
      }
      
      try {
        // First try to send message to existing content script
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showSidebar',
          summaries: {},
          semanticGroups: null,
          totalSelectedTabs: totalSelectedTabs
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
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Now show sidebar
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showSidebar',
            summaries: {},
            semanticGroups: null,
            totalSelectedTabs: totalSelectedTabs
          });
          
          console.log(`Successfully injected and showed sidebar in tab ${tab.id}`);
        } catch (injectError) {
          console.error(`Failed to inject into tab ${tab.id}:`, injectError);
          // Some tabs cannot be scripted due to policies (e.g., chrome:// pages, extensions settings)
          // This is expected behavior, so we continue with other tabs
        }
      }
    }

    // Apply semantic grouping if enabled
    let processOrder = tabsToProcess;
    let semanticGroups = null;
    
    if (config.semanticGrouping) {
      console.log('background.js: Applying semantic grouping...');
      try {
        semanticGroups = await applySemanticGrouping(tabsToProcess, config);
        console.log('background.js: Semantic groups created:', Object.keys(semanticGroups));
      } catch (error) {
        console.error('background.js: Error applying semantic grouping:', error);
        // Continue without grouping if it fails
      }
    }

    // Capture all screenshots and page content first
    console.log('background.js: Starting data capture phase...');
    const tabsWithData = [];
    for (let i = 0; i < processOrder.length; i++) {
      const tab = processOrder[i];
      console.log(`Capturing data for tab ${i + 1}/${processOrder.length}: ${tab.title}`);
      
      const tabData = await captureTabData(tab);
      tabsWithData.push({
        ...tab,
        pageData: tabData.pageData,
        screenshot: tabData.screenshot
      });
      
      // Respect rate limits between captures (Chrome allows max 2 captures per second)
      if (i < processOrder.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('background.js: Data capture complete. Returning to original tab...');
    
    // Return to the original tab after data capture is complete
    try {
      await chrome.tabs.update(originalTabId, { active: true });
      console.log('background.js: Returned to original tab');
    } catch (error) {
      console.error('background.js: Could not return to original tab:', error);
      // Original tab might have been closed, that's okay
    }
    
    console.log('background.js: Starting AI processing...');
    
    // Process all captured data with AI sequentially
    for (let i = 0; i < tabsWithData.length; i++) {
      const tabWithData = tabsWithData[i];
      console.log(`Processing tab ${i + 1}/${tabsWithData.length} with AI: ${tabWithData.title}`);
      
      await processTabWithAI(tabWithData, config, windowId, semanticGroups);
      
      // Update sidebar after each AI processing
      await updateAllSidebars(windowId, semanticGroups, totalSelectedTabs);
      
      // Small delay between AI calls to respect rate limits
      if (i < tabsWithData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // If semantic grouping was applied, store the group information
    if (semanticGroups) {
      await chrome.storage.local.set({ 
        [`tabSummaries_${windowId}`]: summaryCacheByWindow[windowId],
        [`semanticGroups_${windowId}`]: semanticGroups
      });
    } else {
      await chrome.storage.local.set({ 
        [`tabSummaries_${windowId}`]: summaryCacheByWindow[windowId] 
      });
    }
    
    console.log(`Summarization complete for window ${windowId}`);
    
  } catch (error) {
    console.error('Error during summarization:', error);
  } finally {
    isProcessingByWindow[windowId] = false;
  }
}

// New function to capture tab data (screenshots and page content)
async function captureTabData(tab) {
  // Helper function to check if tab can be scripted
  const isScriptableTab = (tab) => {
    return !tab.url.startsWith('chrome://') && 
           !tab.url.startsWith('chrome-extension://') &&
           !tab.url.startsWith('edge://') &&
           !tab.url.startsWith('about:') &&
           !tab.url.startsWith('moz-extension://') &&
           !tab.url.startsWith('file://');
  };

  if (!isScriptableTab(tab)) {
    console.log(`Skipping system tab: ${tab.url}`);
    return { pageData: null, screenshot: null };
  }

  let pageData = null;
  let screenshot = null;

  // Capture page content
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

  // Capture screenshot with improved rate limit and permission handling
  try {
    // Check if tab can be scripted first (already checked above, but defensive)
    if (!isScriptableTab(tab)) {
      console.log(`Skipping screenshot for protected tab: ${tab.url}`);
      return { pageData, screenshot: null };
    }
    
    // Switch to the tab briefly to capture screenshot
    const originalActiveTab = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Only switch if not already active
    if (originalActiveTab[0].id !== tab.id) {
      await chrome.tabs.update(tab.id, { active: true });
      // Longer delay to ensure tab is fully loaded and permission is active
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Add additional delay to ensure we don't hit rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
    
    screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 70  // Reduced quality to speed up processing
    });
    
    // Switch back to original tab if we switched
    if (originalActiveTab[0] && originalActiveTab[0].id !== tab.id) {
      await chrome.tabs.update(originalActiveTab[0].id, { active: true });
    }
  } catch (error) {
    console.error(`Error capturing screenshot for tab ${tab.id}:`, error);
    // Continue without screenshot rather than failing
  }

  return { pageData, screenshot };
}

// New function to process captured tab data with AI
async function processTabWithAI(tabWithData, config, windowId, semanticGroups = null) {
  const tab = tabWithData;

  try {
    console.log(`Processing tab with AI: ${tab.title}`);
    
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

    // Generate summary using selected provider with captured data
    let summaryResult;
    console.log('Using provider:', config.provider, 'with config:', JSON.stringify(config));
    
    try {
      if (config.provider === 'ollama') {
        console.log('Calling Ollama with model:', config.model);
        summaryResult = await generateSummaryWithOllama(
          tab.pageData?.textContent || tab.title,
          tab.screenshot,
          tab.title,
          tab.url,
          config.model
        );
      } else if (config.provider === 'openai') {
        console.log('Calling GPT-5 with API key:', config.apiKey ? 'provided' : 'missing');
        summaryResult = await generateSummaryWithGPT5(
          tab.pageData?.textContent || tab.title,
          tab.screenshot,
          tab.title,
          tab.url,
          config.apiKey
        );
      } else if (config.provider === 'claude') {
        console.log('Calling Claude with API key:', config.apiKey ? 'provided' : 'missing', 'model:', config.model);
        summaryResult = await generateSummaryWithClaude(
          tab.pageData?.textContent || tab.title,
          tab.screenshot,
          tab.title,
          tab.url,
          config.apiKey,
          config.model
        );
      } else if (config.provider === 'perplexity') {
        console.log('Calling Perplexity with API key:', config.apiKey ? 'provided' : 'missing', 'model:', config.model);
        summaryResult = await generateSummaryWithPerplexity(
          tab.pageData?.textContent || tab.title,
          tab.screenshot,
          tab.title,
          tab.url,
          config.apiKey,
          config.model
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

// Original function kept for backwards compatibility but simplified
async function processSingleTab(tab, config, windowId, semanticGroups = null) {
  // This function is now just a wrapper that combines capture and processing
  const tabData = await captureTabData(tab);
  const tabWithData = {
    ...tab,
    pageData: tabData.pageData,
    screenshot: tabData.screenshot
  };
  await processTabWithAI(tabWithData, config, windowId, semanticGroups);
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

async function updateAllSidebars(windowId, semanticGroups = null, totalSelectedTabs = null) {
  try {
    const tabs = await chrome.tabs.query({ windowId: windowId });
    
    // Helper function to check if tab can be scripted
    const isScriptableTab = (tab) => {
      return !tab.url.startsWith('chrome://') && 
             !tab.url.startsWith('chrome-extension://') &&
             !tab.url.startsWith('edge://') &&
             !tab.url.startsWith('about:') &&
             !tab.url.startsWith('moz-extension://') &&
             !tab.url.startsWith('file://');
    };
    
    for (const tab of tabs) {
      if (!isScriptableTab(tab)) {
        continue;
      }
      
      try {
        // Use passed semantic groups, or get from storage if not provided
        let groupsToUse = semanticGroups;
        if (!groupsToUse) {
          const result = await chrome.storage.local.get([`semanticGroups_${windowId}`]);
          groupsToUse = result[`semanticGroups_${windowId}`] || null;
        }
        
        // Use passed total, or fall back to summaries count
        let totalTabs = totalSelectedTabs;
        if (!totalTabs) {
          totalTabs = Object.keys(summaryCacheByWindow[windowId] || {}).length;
        }
        
        await chrome.tabs.sendMessage(tab.id, {
          action: 'updateSidebar',
          summaries: summaryCacheByWindow[windowId] || {},
          semanticGroups: groupsToUse,
          totalSelectedTabs: totalTabs
        });
      } catch (error) {
        // Tab might not have content script injected or might be protected
        console.log(`Could not update sidebar in tab ${tab.id}: ${error.message}`);
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
    
    // First update the sidebar state to hidden
    if (windowId) {
      const result = await chrome.storage.local.get([`sidebarState_${windowId}`]);
      const currentState = result[`sidebarState_${windowId}`] || {};
      const updatedState = {
        ...currentState,
        isVisible: false
      };
      await chrome.storage.local.set({ [`sidebarState_${windowId}`]: updatedState });
    }
    
    // Helper function to check if tab can be scripted
    const isScriptableTab = (tab) => {
      return !tab.url.startsWith('chrome://') && 
             !tab.url.startsWith('chrome-extension://') &&
             !tab.url.startsWith('edge://') &&
             !tab.url.startsWith('about:') &&
             !tab.url.startsWith('moz-extension://') &&
             !tab.url.startsWith('file://');
    };

    // Then hide sidebar in all tabs
    for (const tab of tabs) {
      if (!isScriptableTab(tab)) {
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
      await chrome.storage.local.remove([`tabSummaries_${windowId}`, `semanticGroups_${windowId}`, `sidebarState_${windowId}`]);
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
    const result = await chrome.storage.local.get([`tabSummaries_${windowId}`, `semanticGroups_${windowId}`, `sidebarState_${windowId}`]);
    const summaries = result[`tabSummaries_${windowId}`];
    const semanticGroups = result[`semanticGroups_${windowId}`];
    const sidebarState = result[`sidebarState_${windowId}`];
    
    // Helper function to check if tab can be scripted
    const isScriptableTab = (tab) => {
      return !tab.url.startsWith('chrome://') && 
             !tab.url.startsWith('chrome-extension://') &&
             !tab.url.startsWith('edge://') &&
             !tab.url.startsWith('about:') &&
             !tab.url.startsWith('moz-extension://') &&
             !tab.url.startsWith('file://');
    };

    // Only show sidebar if we have summaries AND the sidebar is explicitly set to visible
    if (summaries && Object.keys(summaries).length > 0 && sidebarState?.isVisible === true) {
      // Skip system/protected tabs
      if (!isScriptableTab(tab)) {
        return;
      }
      
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
        // Script might already be injected or tab cannot be scripted
        console.log(`Could not inject scripts into tab ${tabId}:`, error.message);
      }
      
      // Small delay to ensure scripts are loaded
      await new Promise(resolve => setTimeout(resolve, 200));
      
      try {
        await chrome.tabs.sendMessage(tabId, {
          action: 'showSidebar',
          summaries: summaries,
          semanticGroups: semanticGroups,
          totalSelectedTabs: Object.keys(summaries).length
        });
      } catch (error) {
        console.log(`Could not show sidebar in tab ${tabId}:`, error.message);
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
      await updateAllSidebars(parseInt(windowId), null, null);
      break;
    }
  }
});

// Semantic grouping functions
async function applySemanticGrouping(tabs, config) {
  try {
    console.log('background.js: Starting semantic grouping for', tabs.length, 'tabs');
    
    // First, try to get basic page content for better categorization
    const tabsWithContent = [];
    for (const tab of tabs) {
      let content = '';
      try {
        const pageData = await chrome.tabs.sendMessage(tab.id, { action: 'capturePage' });
        content = pageData?.textContent || '';
      } catch (error) {
        console.log(`Could not get content for tab ${tab.id}`);
      }
      
      tabsWithContent.push({
        ...tab,
        content: content.substring(0, 1000) // Limit content length for grouping
      });
    }
    
    // Use AI to create semantic groups if we have a provider
    if (config.provider && tabsWithContent.length > 3) {
      try {
        return await createAISemanticGroups(tabsWithContent, config);
      } catch (error) {
        console.error('AI grouping failed, falling back to rule-based grouping:', error);
      }
    }
    
    // Fallback to rule-based grouping
    const grouping = new SemanticGrouping();
    return grouping.groupTabs(tabsWithContent);
    
  } catch (error) {
    console.error('Error in semantic grouping:', error);
    throw error;
  }
}

async function createAISemanticGroups(tabs, config) {
  console.log('background.js: Using AI for semantic grouping');
  
  // Prepare tab data for AI analysis
  const tabSummary = tabs.map(tab => ({
    title: tab.title,
    url: new URL(tab.url).hostname,
    content: tab.content.substring(0, 200) // Brief content preview
  }));
  
  const prompt = `Analyze these browser tabs and group them into semantic categories. Create 3-6 meaningful categories based on the content and purpose of the tabs.

Tab data:
${tabSummary.map((tab, i) => `${i + 1}. Title: ${tab.title}\n   Domain: ${tab.url}\n   Content: ${tab.content.slice(0, 150)}...`).join('\n\n')}

Return a JSON object where keys are category names and values are arrays of tab indices (1-based) that belong to each category. Also include a "description" field for each category.

Example format:
{
  "Work & Productivity": {
    "description": "Work-related tools and documents",
    "tabs": [1, 3, 5]
  },
  "Entertainment": {
    "description": "Streaming and entertainment content", 
    "tabs": [2, 4]
  }
}`;

  let aiGroups;
  try {
    if (config.provider === 'openai') {
      const result = await callOpenAIForGrouping(prompt, config.apiKey);
      aiGroups = JSON.parse(result);
    } else if (config.provider === 'claude') {
      const result = await callClaudeForGrouping(prompt, config.apiKey, config.model);
      aiGroups = JSON.parse(result);
    } else if (config.provider === 'perplexity') {
      const result = await callPerplexityForGrouping(prompt, config.apiKey, config.model);
      aiGroups = JSON.parse(result);
    } else if (config.provider === 'ollama') {
      const result = await callOllamaForGrouping(prompt, config.model);
      aiGroups = JSON.parse(result);
    } else {
      throw new Error('Unsupported provider for AI grouping');
    }
  } catch (error) {
    console.error('Error parsing AI grouping response:', error);
    throw error;
  }
  
  // Convert AI response to our format with actual tab objects
  const groups = {};
  for (const [categoryName, categoryData] of Object.entries(aiGroups)) {
    if (categoryData.tabs && Array.isArray(categoryData.tabs)) {
      groups[categoryName] = {
        name: categoryName,
        description: categoryData.description || `${categoryName} related content`,
        tabs: categoryData.tabs.map(index => tabs[index - 1]).filter(Boolean)
      };
    }
  }
  
  console.log('background.js: AI semantic groups created:', Object.keys(groups));
  return groups;
}

// AI provider calls for grouping
async function callOpenAIForGrouping(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data.choices[0].message.content;
}

async function callClaudeForGrouping(prompt, apiKey, model) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Claude API error: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data.content[0].text;
}

async function callPerplexityForGrouping(prompt, apiKey, model) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model || 'sonar',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Perplexity API error: ${data.error?.message || 'Unknown error'}`);
  }
  
  return data.choices[0].message.content;
}

async function callOllamaForGrouping(prompt, model) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 1000
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }
  
  const data = await response.json();
  return data.response;
}