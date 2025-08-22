document.addEventListener('DOMContentLoaded', async () => {
  // Get all UI elements
  const apiKeyInput = document.getElementById('apiKey');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const claudeApiKeyInput = document.getElementById('claudeApiKey');
  const toggleClaudeKeyBtn = document.getElementById('toggleClaudeKey');
  const claudeModelSelect = document.getElementById('claudeModel');
  const perplexityApiKeyInput = document.getElementById('perplexityApiKey');
  const togglePerplexityKeyBtn = document.getElementById('togglePerplexityKey');
  const perplexityModelSelect = document.getElementById('perplexityModel');
  const startSummaryBtn = document.getElementById('startSummary');
  const clearDataBtn = document.getElementById('clearData');
  const statusDiv = document.getElementById('status');
  const statusText = statusDiv.querySelector('.status-text');
  const providerBtns = document.querySelectorAll('.provider-btn');
  const openaiSection = document.getElementById('openaiSection');
  const claudeSection = document.getElementById('claudeSection');
  const perplexitySection = document.getElementById('perplexitySection');
  const ollamaSection = document.getElementById('ollamaSection');
  const ollamaModelSelect = document.getElementById('ollamaModel');
  const refreshModelsBtn = document.getElementById('refreshModels');
  const testBtn = document.getElementById('testBackground');
  
  let currentProvider = 'openai';

  // Load saved settings
  const result = await chrome.storage.local.get([
    'openaiApiKey', 
    'claudeApiKey',
    'claudeModel',
    'perplexityApiKey',
    'perplexityModel',
    'provider', 
    'ollamaModel'
  ]);
  
  if (result.provider) {
    currentProvider = result.provider;
    updateProviderUI(currentProvider);
  }
  
  // Load OpenAI settings
  if (result.openaiApiKey) {
    apiKeyInput.value = result.openaiApiKey;
    if (currentProvider === 'openai') {
      startSummaryBtn.disabled = false;
    }
  }
  
  // Load Claude settings
  if (result.claudeApiKey) {
    claudeApiKeyInput.value = result.claudeApiKey;
    if (currentProvider === 'claude') {
      startSummaryBtn.disabled = false;
    }
  }
  if (result.claudeModel) {
    claudeModelSelect.value = result.claudeModel;
  }
  
  // Load Perplexity settings
  if (result.perplexityApiKey) {
    perplexityApiKeyInput.value = result.perplexityApiKey;
    if (currentProvider === 'perplexity') {
      startSummaryBtn.disabled = false;
    }
  }
  if (result.perplexityModel) {
    perplexityModelSelect.value = result.perplexityModel;
  }
  
  // Load Ollama settings
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

  // Toggle OpenAI API key visibility
  toggleApiKeyBtn.addEventListener('click', () => {
    togglePasswordVisibility(apiKeyInput, toggleApiKeyBtn);
  });
  
  // Toggle Claude API key visibility
  toggleClaudeKeyBtn.addEventListener('click', () => {
    togglePasswordVisibility(claudeApiKeyInput, toggleClaudeKeyBtn);
  });
  
  // Toggle Perplexity API key visibility
  togglePerplexityKeyBtn.addEventListener('click', () => {
    togglePasswordVisibility(perplexityApiKeyInput, togglePerplexityKeyBtn);
  });
  
  function togglePasswordVisibility(input, button) {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    
    const eyeIcon = button.querySelector('svg');
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
  }

  // Save OpenAI API key
  apiKeyInput.addEventListener('input', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (currentProvider === 'openai') {
      startSummaryBtn.disabled = !apiKey;
    }
    if (apiKey) {
      await chrome.storage.local.set({ openaiApiKey: apiKey });
    }
  });
  
  // Save Claude API key
  claudeApiKeyInput.addEventListener('input', async () => {
    const apiKey = claudeApiKeyInput.value.trim();
    if (currentProvider === 'claude') {
      startSummaryBtn.disabled = !apiKey;
    }
    if (apiKey) {
      await chrome.storage.local.set({ claudeApiKey: apiKey });
    }
  });
  
  // Save Claude model selection
  claudeModelSelect.addEventListener('change', async () => {
    const model = claudeModelSelect.value;
    if (model) {
      await chrome.storage.local.set({ claudeModel: model });
    }
  });
  
  // Save Perplexity API key
  perplexityApiKeyInput.addEventListener('input', async () => {
    const apiKey = perplexityApiKeyInput.value.trim();
    if (currentProvider === 'perplexity') {
      startSummaryBtn.disabled = !apiKey;
    }
    if (apiKey) {
      await chrome.storage.local.set({ perplexityApiKey: apiKey });
    }
  });
  
  // Save Perplexity model selection
  perplexityModelSelect.addEventListener('change', async () => {
    const model = perplexityModelSelect.value;
    if (model) {
      await chrome.storage.local.set({ perplexityModel: model });
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
      } else if (provider === 'claude') {
        startSummaryBtn.disabled = !claudeApiKeyInput.value.trim();
      } else if (provider === 'perplexity') {
        startSummaryBtn.disabled = !perplexityApiKeyInput.value.trim();
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

  // Test background service button
  testBtn.addEventListener('click', async () => {
    console.log('popup.js: Testing background script communication...');
    try {
      const response = await chrome.runtime.sendMessage({ action: 'test' });
      console.log('popup.js: Test response:', response);
      updateStatus('success', 'Background script responding');
    } catch (error) {
      console.error('popup.js: Test failed:', error);
      updateStatus('error', 'Background script not responding');
    }
  });
  
  function updateProviderUI(provider) {
    providerBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.provider === provider);
    });
    
    // Hide all sections
    openaiSection.style.display = 'none';
    claudeSection.style.display = 'none';
    perplexitySection.style.display = 'none';
    ollamaSection.style.display = 'none';
    
    // Show the selected provider's section
    if (provider === 'openai') {
      openaiSection.style.display = 'block';
    } else if (provider === 'claude') {
      claudeSection.style.display = 'block';
    } else if (provider === 'perplexity') {
      perplexitySection.style.display = 'block';
    } else if (provider === 'ollama') {
      ollamaSection.style.display = 'block';
    }
  }
  
  async function loadOllamaModels() {
    console.log('popup.js: loadOllamaModels starting...');
    ollamaModelSelect.innerHTML = '<option value="">Loading models...</option>';
    
    try {
      console.log('popup.js: Sending getOllamaModels message to background script');
      const response = await chrome.runtime.sendMessage({ action: 'getOllamaModels' });
      console.log('popup.js: Received response from background script:', response);
      const models = response || [];
      
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
      updateStatus('error', 'Cannot connect to Ollama. Ensure it\'s running with proper CORS config.');
    }
  }

  // Start summarization
  startSummaryBtn.addEventListener('click', async () => {
    console.log('popup.js: Start Summary button clicked!');
    console.log('popup.js: Current provider:', currentProvider);
    
    let config = { provider: currentProvider };
    
    if (currentProvider === 'openai') {
      const apiKey = apiKeyInput.value.trim();
      console.log('popup.js: OpenAI mode, API key provided:', apiKey ? 'yes' : 'no');
      if (!apiKey) {
        updateStatus('error', 'Please enter your OpenAI API key');
        return;
      }
      config.apiKey = apiKey;
    } else if (currentProvider === 'claude') {
      const apiKey = claudeApiKeyInput.value.trim();
      const model = claudeModelSelect.value;
      console.log('popup.js: Claude mode, API key provided:', apiKey ? 'yes' : 'no');
      if (!apiKey) {
        updateStatus('error', 'Please enter your Anthropic API key');
        return;
      }
      config.apiKey = apiKey;
      config.model = model;
    } else if (currentProvider === 'perplexity') {
      const apiKey = perplexityApiKeyInput.value.trim();
      const model = perplexityModelSelect.value;
      console.log('popup.js: Perplexity mode, API key provided:', apiKey ? 'yes' : 'no');
      if (!apiKey) {
        updateStatus('error', 'Please enter your Perplexity API key');
        return;
      }
      config.apiKey = apiKey;
      config.model = model;
    } else if (currentProvider === 'ollama') {
      const model = ollamaModelSelect.value;
      console.log('popup.js: Ollama mode, selected model:', model);
      if (!model) {
        updateStatus('error', 'Please select an Ollama model');
        return;
      }
      config.model = model;
    }

    console.log('popup.js: Final config:', config);
    startSummaryBtn.disabled = true;
    updateStatus('loading', 'Starting summarization...');

    try {
      console.log('popup.js: Sending startSummarization message to background script');
      // Send message to background script to start summarization
      const response = await chrome.runtime.sendMessage({
        action: 'startSummarization',
        config: config
      });
      console.log('popup.js: Received startSummarization response:', response);

      updateStatus('success', 'Summarization started! Check the sidebar on each tab.');
      
      // Re-enable button after a short delay
      setTimeout(() => {
        startSummaryBtn.disabled = false;
        updateStatus('', 'Ready to summarize');
      }, 2000);

    } catch (error) {
      console.error('popup.js: Error starting summarization:', error);
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