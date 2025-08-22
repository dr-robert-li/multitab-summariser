document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const startSummaryBtn = document.getElementById('startSummary');
  const clearDataBtn = document.getElementById('clearData');
  const statusDiv = document.getElementById('status');
  const statusText = statusDiv.querySelector('.status-text');
  const providerBtns = document.querySelectorAll('.provider-btn');
  const openaiSection = document.getElementById('openaiSection');
  const ollamaSection = document.getElementById('ollamaSection');
  const ollamaModelSelect = document.getElementById('ollamaModel');
  const refreshModelsBtn = document.getElementById('refreshModels');
  
  let currentProvider = 'openai';

  // Load saved settings
  const result = await chrome.storage.local.get(['openaiApiKey', 'provider', 'ollamaModel']);
  if (result.provider) {
    currentProvider = result.provider;
    updateProviderUI(currentProvider);
  }
  if (result.openaiApiKey) {
    apiKeyInput.value = result.openaiApiKey;
    if (currentProvider === 'openai') {
      startSummaryBtn.disabled = false;
    }
  }
  if (result.ollamaModel) {
    ollamaModelSelect.value = result.ollamaModel;
    if (currentProvider === 'ollama' && result.ollamaModel) {
      startSummaryBtn.disabled = false;
    }
  }
  
  // Load Ollama models if Ollama is selected
  if (currentProvider === 'ollama') {
    loadOllamaModels();
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
    if (currentProvider === 'openai') {
      startSummaryBtn.disabled = !apiKey;
    }
    
    if (apiKey) {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
    }
  });
  
  // Provider switching
  providerBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const provider = btn.dataset.provider;
      currentProvider = provider;
      updateProviderUI(provider);
      await chrome.storage.local.set({ provider: provider });
      
      // Update button state based on provider
      if (provider === 'openai') {
        startSummaryBtn.disabled = !apiKeyInput.value.trim();
      } else if (provider === 'ollama') {
        loadOllamaModels();
        startSummaryBtn.disabled = !ollamaModelSelect.value || ollamaModelSelect.value === '';
      }
    });
  });
  
  // Ollama model selection
  ollamaModelSelect.addEventListener('change', async () => {
    const model = ollamaModelSelect.value;
    if (currentProvider === 'ollama') {
      startSummaryBtn.disabled = !model;
    }
    if (model) {
      await chrome.storage.local.set({ ollamaModel: model });
    }
  });
  
  // Refresh Ollama models
  refreshModelsBtn.addEventListener('click', () => {
    loadOllamaModels();
  });
  
  function updateProviderUI(provider) {
    providerBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.provider === provider);
    });
    
    if (provider === 'openai') {
      openaiSection.style.display = 'block';
      ollamaSection.style.display = 'none';
    } else {
      openaiSection.style.display = 'none';
      ollamaSection.style.display = 'block';
    }
  }
  
  async function loadOllamaModels() {
    ollamaModelSelect.innerHTML = '<option value="">Loading models...</option>';
    
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (!response.ok) throw new Error('Failed to fetch models');
      
      const data = await response.json();
      const models = data.models || [];
      
      if (models.length === 0) {
        ollamaModelSelect.innerHTML = '<option value="">No models found</option>';
        updateStatus('error', 'No Ollama models found. Please pull a model first.');
      } else {
        ollamaModelSelect.innerHTML = '<option value="">Select a model</option>';
        models.forEach(model => {
          const option = document.createElement('option');
          option.value = model.name;
          option.textContent = model.name;
          ollamaModelSelect.appendChild(option);
        });
        
        // Restore previously selected model
        const saved = await chrome.storage.local.get(['ollamaModel']);
        if (saved.ollamaModel && models.some(m => m.name === saved.ollamaModel)) {
          ollamaModelSelect.value = saved.ollamaModel;
          if (currentProvider === 'ollama') {
            startSummaryBtn.disabled = false;
          }
        }
      }
    } catch (error) {
      console.error('Error loading Ollama models:', error);
      ollamaModelSelect.innerHTML = '<option value="">Failed to load models</option>';
      updateStatus('error', 'Cannot connect to Ollama. Ensure it\'s running on port 11434.');
    }
  }

  // Start summarization
  startSummaryBtn.addEventListener('click', async () => {
    let config = { provider: currentProvider };
    
    if (currentProvider === 'openai') {
      const apiKey = apiKeyInput.value.trim();
      if (!apiKey) {
        updateStatus('error', 'Please enter your OpenAI API key');
        return;
      }
      config.apiKey = apiKey;
    } else if (currentProvider === 'ollama') {
      const model = ollamaModelSelect.value;
      if (!model) {
        updateStatus('error', 'Please select an Ollama model');
        return;
      }
      config.model = model;
    }

    startSummaryBtn.disabled = true;
    updateStatus('loading', 'Starting summarization...');

    try {
      // Send message to background script to start summarization
      await chrome.runtime.sendMessage({
        action: 'startSummarization',
        config: config
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