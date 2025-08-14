// Debug helper for sidebar issues

async function debugSidebar() {
  console.log('🔍 Debug: Checking sidebar functionality...');
  
  // Check if content script is loaded
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    
    console.log('📍 Current tab:', activeTab.url);
    
    // Try to send a message to content script
    try {
      const response = await chrome.tabs.sendMessage(activeTab.id, { 
        action: 'showSidebar', 
        summaries: { 
          test: { 
            title: 'Test Summary', 
            url: activeTab.url, 
            summary: 'This is a test summary to check if sidebar appears.',
            keyPoints: ['Test point 1', 'Test point 2']
          } 
        } 
      });
      console.log('✅ Content script responded:', response);
    } catch (error) {
      console.error('❌ Content script not responding:', error);
      
      // Try to inject content script manually
      console.log('💉 Attempting to inject content script...');
      
      try {
        await chrome.scripting.executeScript({
          target: { tabId: activeTab.id },
          files: ['content.js']
        });
        
        await chrome.scripting.insertCSS({
          target: { tabId: activeTab.id },
          files: ['sidebar.css']
        });
        
        console.log('✅ Scripts injected successfully');
        
        // Try showing sidebar again
        setTimeout(async () => {
          const response = await chrome.tabs.sendMessage(activeTab.id, { 
            action: 'showSidebar', 
            summaries: { 
              test: { 
                title: 'Test Summary', 
                url: activeTab.url, 
                summary: 'This is a test summary after injection.',
                keyPoints: ['Test point 1', 'Test point 2']
              } 
            } 
          });
          console.log('✅ Sidebar should now be visible');
        }, 500);
        
      } catch (injectError) {
        console.error('❌ Failed to inject scripts:', injectError);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Export for use in background script
// Service workers don't have window object, use global scope
if (typeof globalThis !== 'undefined') {
  globalThis.debugSidebar = debugSidebar;
}