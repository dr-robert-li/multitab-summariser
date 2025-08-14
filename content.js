let sidebar = null;
let summaryData = null;

// Initialize content script
(function init() {
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'capturePage':
        capturePage().then(sendResponse);
        return true; // Keep message channel open for async response
      
      case 'showSidebar':
        showSidebar(message.summaries);
        sendResponse({ success: true });
        break;
      
      case 'hideSidebar':
        hideSidebar();
        sendResponse({ success: true });
        break;
      
      case 'updateSidebar':
        updateSidebar(message.summaries);
        sendResponse({ success: true });
        break;
    }
  });

  // Check if there are existing summaries to show for current window
  chrome.runtime.sendMessage({ action: 'getWindowId' }, (response) => {
    if (response && response.windowId) {
      chrome.storage.local.get([`tabSummaries_${response.windowId}`]).then(result => {
        const summaries = result[`tabSummaries_${response.windowId}`];
        if (summaries && Object.keys(summaries).length > 0) {
          showSidebar(summaries);
        }
      });
    }
  });
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

function showSidebar(summaries) {
  if (sidebar) {
    updateSidebar(summaries);
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
  updateSidebar(summaries);
  
  // Animate in
  setTimeout(() => {
    sidebar.classList.add('visible');
  }, 10);
}

function hideSidebar() {
  if (sidebar) {
    sidebar.classList.remove('visible');
    setTimeout(() => {
      if (sidebar && sidebar.parentNode) {
        sidebar.parentNode.removeChild(sidebar);
        sidebar = null;
      }
    }, 300);
  }
}

function updateSidebar(summaries) {
  if (!sidebar || !summaries) return;
  
  summaryData = summaries;
  const summariesContainer = sidebar.querySelector('.summaries-container');
  const currentUrl = window.location.href;
  
  // Clear existing summaries
  summariesContainer.innerHTML = '';
  
  // Calculate progress
  const totalTabs = Object.keys(summaries).length;
  const completedTabs = Object.values(summaries).filter(s => s.summary || s.error).length;
  
  // Update progress bar
  const progressContainer = sidebar.querySelector('.progress-container');
  const progressFill = sidebar.querySelector('.progress-fill');
  const progressText = sidebar.querySelector('.progress-text');
  
  if (progressContainer && completedTabs < totalTabs) {
    progressContainer.style.display = 'block';
    const percentage = totalTabs > 0 ? (completedTabs / totalTabs) * 100 : 0;
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `Processing ${completedTabs} of ${totalTabs} tabs...`;
  } else if (progressContainer) {
    progressContainer.style.display = 'none';
  }
  
  // Add summaries for each tab
  Object.entries(summaries).forEach(([tabId, summary]) => {
    const summaryElement = createSummaryElement(summary, summary.url === currentUrl);
    summariesContainer.appendChild(summaryElement);
  });
  
  // Update summary count
  const countElement = sidebar.querySelector('.summary-count');
  if (countElement) {
    if (completedTabs === totalTabs && totalTabs > 0) {
      countElement.textContent = `${totalTabs} tabs summarized`;
    } else {
      countElement.textContent = `Processing summaries...`;
    }
  }
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
  element.className = `summary-item ${isCurrentTab ? 'current-tab' : ''} ${summary.expanded ? 'expanded' : ''}`;
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
      if (summaryData && summaryData[summary.tabId]) {
        summaryData[summary.tabId].expanded = element.classList.contains('expanded');
      }
    });
  }
  
  // Add click handler to navigate to tab (on header, not button)
  const header = element.querySelector('.summary-header');
  header.addEventListener('click', (e) => {
    if (e.target.closest('.expand-btn')) return; // Don't navigate if clicking expand button
    
    if (summary.tabId) {
      chrome.runtime.sendMessage({
        action: 'switchToTab',
        tabId: summary.tabId
      });
    }
  });
  
  return element;
}

function setupSidebarEventListeners() {
  // Close button
  const closeBtn = sidebar.querySelector('#closeSidebar');
  closeBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'hideSidebar' });
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