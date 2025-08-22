// Check if content script is already injected
if (window.__multiTabSummarizerInjected) {
  console.log('Multi-tab summarizer already injected, skipping');
} else {
  window.__multiTabSummarizerInjected = true;

  let sidebar = null;
  let summaryData = null;
  let sidebarState = {
    isVisible: false,
    expandedItems: new Set()
  };

  // Initialize content script
  (function init() {
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'capturePage':
        capturePage().then(sendResponse);
        return true; // Keep message channel open for async response
      
      case 'showSidebar':
        showSidebar(message.summaries, message.semanticGroups, message.totalSelectedTabs);
        sendResponse({ success: true });
        break;
      
      case 'hideSidebar':
        hideSidebar();
        sendResponse({ success: true });
        break;
      
      case 'updateSidebar':
        updateSidebar(message.summaries, message.semanticGroups, message.totalSelectedTabs);
        sendResponse({ success: true });
        break;
    }
  });

  // Check if there are existing summaries to show for current window
  if (chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage({ action: 'getWindowId' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Extension context invalidated, skipping initialization');
        return;
      }
      if (response && response.windowId) {
        chrome.storage.local.get([`tabSummaries_${response.windowId}`, `semanticGroups_${response.windowId}`, `sidebarState_${response.windowId}`]).then(result => {
          const summaries = result[`tabSummaries_${response.windowId}`];
          const semanticGroups = result[`semanticGroups_${response.windowId}`];
          const savedState = result[`sidebarState_${response.windowId}`];
          
          if (savedState) {
            sidebarState.isVisible = savedState.isVisible;
            // Convert array back to Set
            sidebarState.expandedItems = new Set(savedState.expandedItems || []);
          }
          
          if (summaries && Object.keys(summaries).length > 0 && sidebarState.isVisible) {
            showSidebar(summaries, semanticGroups, Object.keys(summaries).length);
          }
        });
      }
    });
  }
})();

async function capturePage() {
  try {
    // Get page title and URL
    const pageTitle = document.title;
    const pageUrl = window.location.href;
    
    // Get page text content (simplified)
    const textContent = getPageTextContent();
    
    // Capture screenshot using chrome.tabs API (will be handled by background script)
    const response = await chrome.runtime.sendMessage({
      action: 'captureScreenshot',
      tabInfo: {
        title: pageTitle,
        url: pageUrl,
        textContent: textContent
      }
    });
    
    return {
      title: pageTitle,
      url: pageUrl,
      textContent: textContent,
      screenshot: response.screenshot
    };
  } catch (error) {
    console.error('Error capturing page:', error);
    return {
      title: document.title,
      url: window.location.href,
      textContent: getPageTextContent(),
      screenshot: null
    };
  }
}

function getPageTextContent() {
  // Remove script and style elements
  const scripts = document.querySelectorAll('script, style, nav, footer, aside');
  scripts.forEach(el => el.remove());
  
  // Get main content
  const main = document.querySelector('main, article, .content, #content, .main');
  const content = main || document.body;
  
  // Extract text and clean it up
  let text = content.innerText || content.textContent || '';
  
  // Clean up whitespace and limit length
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit to first 3000 characters for API efficiency
  return text.substring(0, 3000);
}

function showSidebar(summaries, semanticGroups = null, totalSelectedTabs = null) {
  if (sidebar) {
    updateSidebar(summaries, semanticGroups, totalSelectedTabs);
    return;
  }

  // Create sidebar container
  sidebar = document.createElement('div');
  sidebar.id = 'multi-tab-summarizer-sidebar';
  sidebar.innerHTML = createSidebarHTML();
  
  // Add sidebar styles
  if (!document.getElementById('multi-tab-summarizer-styles')) {
    const styleSheet = document.createElement('link');
    styleSheet.id = 'multi-tab-summarizer-styles';
    styleSheet.rel = 'stylesheet';
    styleSheet.href = chrome.runtime.getURL('sidebar.css');
    document.head.appendChild(styleSheet);
  }
  
  document.body.appendChild(sidebar);
  
  // Add event listeners
  setupSidebarEventListeners();
  
  // Update with summaries
  updateSidebar(summaries, semanticGroups, totalSelectedTabs);
  
  // Mark sidebar as visible and save state
  sidebarState.isVisible = true;
  saveSidebarState();
  
  // Animate in
  setTimeout(() => {
    sidebar.classList.add('visible');
  }, 10);
}

function hideSidebar() {
  if (sidebar) {
    sidebar.classList.remove('visible');
    sidebarState.isVisible = false;
    // Don't save state here - let the background script handle it
    // This prevents race conditions between tabs
    
    setTimeout(() => {
      if (sidebar && sidebar.parentNode) {
        sidebar.parentNode.removeChild(sidebar);
        sidebar = null;
      }
    }, 300);
  }
}

function updateSidebar(summaries, semanticGroups = null, totalSelectedTabs = null) {
  if (!sidebar) return;
  
  // Handle case where summaries might be null or empty but we still want to show progress
  summaries = summaries || {};
  
  summaryData = summaries;
  const summariesContainer = sidebar.querySelector('.summaries-container');
  const currentUrl = window.location.href;
  
  // Clear existing summaries
  summariesContainer.innerHTML = '';
  
  // Calculate progress - determine total tabs correctly based on context
  let totalTabs;
  if (totalSelectedTabs && totalSelectedTabs > 0) {
    // Use the passed total (most accurate)
    totalTabs = totalSelectedTabs;
  } else if (semanticGroups && Object.keys(semanticGroups).length > 0) {
    // Count total tabs from semantic groups
    totalTabs = Object.values(semanticGroups).reduce((total, group) => total + group.tabs.length, 0);
  } else {
    // Fall back to summaries count
    totalTabs = Object.keys(summaries).length;
  }
  
  const completedTabs = Object.values(summaries).filter(s => s.summary || s.error).length;
  
  // Update progress bar
  const progressContainer = sidebar.querySelector('.progress-container');
  const progressFill = sidebar.querySelector('.progress-fill');
  const progressText = sidebar.querySelector('.progress-text');
  
  if (progressContainer && totalTabs > 0 && completedTabs < totalTabs) {
    progressContainer.style.display = 'block';
    const percentage = (completedTabs / totalTabs) * 100;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Processing ${completedTabs} of ${totalTabs} tabs...`;
  } else if (progressContainer) {
    progressContainer.style.display = 'none';
  }
  
  // Display summaries with semantic grouping
  if (semanticGroups && Object.keys(semanticGroups).length > 0) {
    displayGroupedSummaries(summaries, semanticGroups, currentUrl, summariesContainer);
  } else {
    displayUngroupedSummaries(summaries, currentUrl, summariesContainer);
  }
  
  // Update summary count with progress
  const countElement = sidebar.querySelector('.summary-count');
  if (countElement) {
    const groupText = semanticGroups ? ` in ${Object.keys(semanticGroups).length} groups` : '';
    
    if (completedTabs === totalTabs && totalTabs > 0) {
      // All summaries completed
      countElement.innerHTML = `
        <span class="summary-status complete">✓</span>
        ${completedTabs}/${totalTabs} tabs summarized${groupText}
      `;
      countElement.className = 'summary-count complete';
    } else if (completedTabs > 0) {
      // Some summaries completed, others in progress
      countElement.innerHTML = `
        <span class="summary-status progress">⏳</span>
        ${completedTabs}/${totalTabs} tabs summarized${groupText}
      `;
      countElement.className = 'summary-count progress';
    } else {
      // No summaries completed yet
      countElement.innerHTML = `
        <span class="summary-status pending">⏸</span>
        Processing summaries...
      `;
      countElement.className = 'summary-count pending';
    }
  }
}

function displayGroupedSummaries(summaries, semanticGroups, currentUrl, container) {
  // Create groups
  Object.entries(semanticGroups).forEach(([groupName, groupData]) => {
    // Calculate group progress
    const groupProgress = calculateGroupProgress(groupData.tabs, summaries);
    
    // Create group container
    const groupElement = document.createElement('div');
    groupElement.className = 'semantic-group';
    groupElement.setAttribute('data-category', groupName);
    
    // Create group header
    const groupHeader = document.createElement('div');
    groupHeader.className = 'group-header';
    groupHeader.innerHTML = `
      <div class="group-info">
        <div class="group-name">${groupName}</div>
        <div class="group-description">${groupData.description}</div>
        <div class="group-meta">
          <div class="group-count">${groupData.tabs.length} tab${groupData.tabs.length > 1 ? 's' : ''}</div>
          <div class="group-status ${groupProgress.statusClass}">${groupProgress.statusText}</div>
        </div>
      </div>
      <button class="group-expand-btn" aria-label="Toggle group">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,5 6,8 9,5"></polyline>
        </svg>
      </button>
    `;
    
    // Create group content
    const groupContent = document.createElement('div');
    groupContent.className = 'group-content';
    
    // Add tabs to group
    groupData.tabs.forEach(tab => {
      const summary = summaries[tab.id];
      if (summary) {
        const summaryElement = createSummaryElement(summary, summary.url === currentUrl);
        groupContent.appendChild(summaryElement);
      }
    });
    
    // Add expand/collapse functionality
    const expandBtn = groupHeader.querySelector('.group-expand-btn');
    const groupKey = `group-${groupName}`;
    const isExpanded = sidebarState.expandedItems.has(groupKey);
    
    if (isExpanded) {
      groupElement.classList.add('expanded');
    }
    
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      groupElement.classList.toggle('expanded');
      
      if (groupElement.classList.contains('expanded')) {
        sidebarState.expandedItems.add(groupKey);
      } else {
        sidebarState.expandedItems.delete(groupKey);
      }
      saveSidebarState();
    });
    
    groupElement.appendChild(groupHeader);
    groupElement.appendChild(groupContent);
    container.appendChild(groupElement);
  });
}

function calculateGroupProgress(tabsInGroup, summaries) {
  const totalTabs = tabsInGroup.length;
  let completedTabs = 0;
  let errorTabs = 0;
  
  tabsInGroup.forEach(tab => {
    const summary = summaries[tab.id];
    if (summary) {
      if (summary.summary || summary.error) {
        completedTabs++;
        if (summary.error) {
          errorTabs++;
        }
      }
    }
  });
  
  const inProgressTabs = totalTabs - completedTabs;
  
  if (completedTabs === 0) {
    // No summaries started yet
    return {
      statusText: 'Pending',
      statusClass: 'status-pending'
    };
  } else if (inProgressTabs > 0) {
    // Some summaries in progress
    return {
      statusText: `In Progress (${completedTabs}/${totalTabs})`,
      statusClass: 'status-progress'
    };
  } else if (errorTabs > 0 && errorTabs === completedTabs) {
    // All summaries failed
    return {
      statusText: 'Failed',
      statusClass: 'status-error'
    };
  } else if (errorTabs > 0) {
    // Some summaries failed, some succeeded
    return {
      statusText: `Completed with errors (${errorTabs} failed)`,
      statusClass: 'status-partial'
    };
  } else {
    // All summaries completed successfully
    return {
      statusText: 'Complete',
      statusClass: 'status-complete'
    };
  }
}

function displayUngroupedSummaries(summaries, currentUrl, container) {
  // If no summaries yet, show loading state
  if (Object.keys(summaries).length === 0) {
    container.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Starting summarization...</p>
      </div>
    `;
    return;
  }

  // Add summaries for each tab (original behavior)
  Object.entries(summaries).forEach(([tabId, summary]) => {
    const summaryElement = createSummaryElement(summary, summary.url === currentUrl);
    container.appendChild(summaryElement);
  });
}

function createSidebarHTML() {
  return `
    <div class="sidebar-header">
      <div class="sidebar-title">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        Tab Summaries
      </div>
      <button class="close-btn" id="closeSidebar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="sidebar-content">
      <div class="summary-count">Loading summaries...</div>
      <div class="progress-container" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        <div class="progress-text">Processing 0 of 0 tabs...</div>
      </div>
      <div class="summaries-container">
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Generating summaries...</p>
        </div>
      </div>
    </div>
  `;
}

function createSummaryElement(summary, isCurrentTab = false) {
  const element = document.createElement('div');
  // Ensure expandedItems is a Set
  if (!(sidebarState.expandedItems instanceof Set)) {
    sidebarState.expandedItems = new Set(Array.isArray(sidebarState.expandedItems) ? sidebarState.expandedItems : []);
  }
  const isExpanded = sidebarState.expandedItems.has(String(summary.tabId));
  element.className = `summary-item ${isCurrentTab ? 'current-tab' : ''} ${isExpanded ? 'expanded' : ''}`;
  element.dataset.tabId = summary.tabId;
  
  const favicon = summary.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>';
  
  // Clean up the summary text if it contains error formatting
  let summaryText = summary.summary || '';
  if (summaryText.includes('keyPoints:')) {
    summaryText = summaryText.split('keyPoints:')[0].trim();
  }
  
  // Truncate summary for collapsed view
  const truncatedSummary = summaryText.length > 100 ? 
    summaryText.substring(0, 100) + '...' : summaryText;
  
  element.innerHTML = `
    <div class="summary-header" data-tab-id="${summary.tabId}">
      <img src="${favicon}" alt="" class="tab-favicon" onerror="this.style.display='none'">
      <div class="tab-info">
        <div class="tab-title" title="${summary.title}">${summary.title}</div>
        <div class="tab-url" title="${summary.url}">${new URL(summary.url).hostname}</div>
      </div>
      ${isCurrentTab ? '<div class="current-indicator">Current</div>' : ''}
      <button class="expand-btn" aria-label="Toggle details">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,5 6,8 9,5"></polyline>
        </svg>
      </button>
    </div>
    <div class="summary-content">
      ${summary.summary ? `
        <div class="summary-text collapsed">${truncatedSummary}</div>
        <div class="summary-text expanded">${summaryText}</div>
        ${summary.keyPoints && Array.isArray(summary.keyPoints) && summary.keyPoints.length > 0 ? `
          <div class="key-points">
            <h4>Key Points:</h4>
            <ul>
              ${summary.keyPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      ` : summary.error ? `
        <div class="summary-error">
          <span>Error: ${summary.error}</span>
        </div>
      ` : `
        <div class="summary-loading">
          <div class="loading-spinner small"></div>
          <span>Generating summary...</span>
        </div>
      `}
    </div>
  `;
  
  // Add click handler to expand/collapse
  const expandBtn = element.querySelector('.expand-btn');
  if (expandBtn) {
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      element.classList.toggle('expanded');
      
      // Update stored state
      const tabIdStr = String(summary.tabId);
      if (element.classList.contains('expanded')) {
        sidebarState.expandedItems.add(tabIdStr);
      } else {
        sidebarState.expandedItems.delete(tabIdStr);
      }
      saveSidebarState();
    });
  }
  
  // Add click handler to navigate to tab (on header, not button)
  const header = element.querySelector('.summary-header');
  header.addEventListener('click', (e) => {
    if (e.target.closest('.expand-btn')) return; // Don't navigate if clicking expand button
    
    if (summary.tabId && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        action: 'switchToTab',
        tabId: summary.tabId
      }, () => {
        if (chrome.runtime.lastError) {
          console.log('Could not switch tab:', chrome.runtime.lastError);
        }
      });
    }
  });
  
  return element;
}

function setupSidebarEventListeners() {
  // Close button
  const closeBtn = sidebar.querySelector('#closeSidebar');
  closeBtn.addEventListener('click', () => {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'hideSidebarFromTab' }, () => {
        if (chrome.runtime.lastError) {
          console.log('Could not hide sidebar:', chrome.runtime.lastError);
        }
      });
    } else {
      // Fallback: hide locally if extension context is invalid
      hideSidebar();
    }
  });
  
  // Prevent sidebar clicks from bubbling to page
  sidebar.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Adjust page layout when sidebar is shown
function adjustPageLayout() {
  if (sidebar && sidebar.classList.contains('visible')) {
    document.body.style.marginRight = '400px';
    document.body.style.transition = 'margin-right 0.3s ease';
  } else {
    document.body.style.marginRight = '';
  }
}

// Observer to watch for sidebar visibility changes
const observer = new MutationObserver(() => {
  adjustPageLayout();
});

if (sidebar) {
  observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
}

// Save sidebar state to storage
async function saveSidebarState() {
  try {
    if (!chrome.runtime || !chrome.runtime.sendMessage) {
      console.log('Extension context invalid, cannot save state');
      return;
    }
    
    chrome.runtime.sendMessage({ action: 'getWindowId' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Could not get window ID:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.windowId) {
        // Ensure expandedItems is a Set before converting
        if (!(sidebarState.expandedItems instanceof Set)) {
          sidebarState.expandedItems = new Set(Array.isArray(sidebarState.expandedItems) ? sidebarState.expandedItems : []);
        }
        
        // Convert Set to Array for storage
        const stateToSave = {
          isVisible: sidebarState.isVisible,
          expandedItems: Array.from(sidebarState.expandedItems)
        };
        chrome.storage.local.set({ [`sidebarState_${response.windowId}`]: stateToSave });
      }
    });
  } catch (error) {
    console.error('Error saving sidebar state:', error);
  }
}

// Restore expanded items from saved state
function restoreExpandedItems() {
  if (sidebarState.expandedItems instanceof Array) {
    sidebarState.expandedItems = new Set(sidebarState.expandedItems);
  } else if (!(sidebarState.expandedItems instanceof Set)) {
    sidebarState.expandedItems = new Set();
  }
}

} // End of injection check wrapper