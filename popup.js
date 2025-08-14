document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const startSummaryBtn = document.getElementById('startSummary');
  const clearDataBtn = document.getElementById('clearData');
  const statusDiv = document.getElementById('status');
  const statusText = statusDiv.querySelector('.status-text');

  // Load saved API key
  const result = await chrome.storage.local.get(['openaiApiKey']);
  if (result.openaiApiKey) {
    apiKeyInput.value = result.openaiApiKey;
    startSummaryBtn.disabled = false;
  }

  // Toggle API key visibility
  toggleApiKeyBtn.addEventListener('click', () => {
    const isPassword = apiKeyInput.type === 'password';
    apiKeyInput.type = isPassword ? 'text' : 'password';
    
    const eyeIcon = toggleApiKeyBtn.querySelector('svg');
    if (isPassword) {
      eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    } else {
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  });

  // Save API key and enable/disable button
  apiKeyInput.addEventListener('input', async () => {
    const apiKey = apiKeyInput.value.trim();
    startSummaryBtn.disabled = !apiKey;
    
    if (apiKey) {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
    }
  });

  // Start summarization
  startSummaryBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      updateStatus('error', 'Please enter your OpenAI API key');
      return;
    }

    startSummaryBtn.disabled = true;
    updateStatus('loading', 'Starting summarization...');

    try {
      // Send message to background script to start summarization
      await chrome.runtime.sendMessage({
        action: 'startSummarization',
        apiKey: apiKey
      });

      updateStatus('success', 'Summarization started! Check the sidebar on each tab.');
      
      // Re-enable button after a short delay
      setTimeout(() => {
        startSummaryBtn.disabled = false;
        updateStatus('', 'Ready to summarize');
      }, 2000);

    } catch (error) {
      console.error('Error starting summarization:', error);
      updateStatus('error', 'Failed to start summarization');
      startSummaryBtn.disabled = false;
    }
  });

  // Clear summaries
  clearDataBtn.addEventListener('click', async () => {
    try {
      await chrome.runtime.sendMessage({ action: 'clearSummaries' });
      updateStatus('success', 'Summaries cleared');
      
      setTimeout(() => {
        updateStatus('', 'Ready to summarize');
      }, 1500);
    } catch (error) {
      console.error('Error clearing summaries:', error);
      updateStatus('error', 'Failed to clear summaries');
    }
  });

  function updateStatus(type, message) {
    statusDiv.className = `status ${type}`;
    
    if (type === 'loading') {
      statusText.innerHTML = `<span class="loading-spinner"></span>${message}`;
    } else {
      statusText.textContent = message;
    }
  }

  // Listen for background script messages
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateStatus') {
      updateStatus(message.type, message.message);
    }
  });
});