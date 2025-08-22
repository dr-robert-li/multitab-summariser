async function getOllamaModels() {
  console.log('getOllamaModels: Starting to fetch models from Ollama...');
  try {
    console.log('getOllamaModels: Making fetch request to http://127.0.0.1:11434/api/tags');
    const response = await fetch('http://127.0.0.1:11434/api/tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('getOllamaModels: Response status:', response.status, 'statusText:', response.statusText);
    console.log('getOllamaModels: Response headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('getOllamaModels: HTTP error response body:', errorText);
      throw new Error(`Failed to fetch models: ${response.status} - ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('getOllamaModels: Successfully fetched', data.models?.length || 0, 'models');
    return data.models || [];
  } catch (error) {
    console.error('getOllamaModels: Error fetching Ollama models:', error.message);
    console.error('getOllamaModels: Full error:', error);
    return [];
  }
}

async function generateSummaryWithOllama(textContent, screenshot, title, url, model) {
  console.log('generateSummaryWithOllama called with model:', model);
  
  if (!model) {
    console.error('No model provided to Ollama');
    return {
      summary: 'No Ollama model selected',
      keyPoints: [],
      error: 'No model selected'
    };
  }
  
  const prompt = `Analyze this web page and create a helpful summary.

Page Title: ${title}
URL: ${url}
${textContent ? `Text Content (first 3000 chars): ${textContent}` : 'No text content available'}

Your response MUST be valid JSON in this exact format:
{
  "summary": "A 2-3 sentence summary describing the main purpose and content of this webpage",
  "keyPoints": [
    "First key point or feature",
    "Second key point or feature", 
    "Third key point or feature"
  ]
}

Important: Return ONLY the JSON object, no additional text or formatting.`;

  try {
    console.log('generateSummaryWithOllama: Sending request to Ollama at http://127.0.0.1:11434/api/generate');
    console.log('generateSummaryWithOllama: Request payload:', {
      model: model,
      prompt: prompt.substring(0, 200) + '...',
      stream: false,
      format: 'json'
    });
    
    // Chrome will automatically set the correct Origin header
    console.log('generateSummaryWithOllama: Making POST request (Chrome will set Origin header automatically)');
    
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        format: 'json',
        options: {
          temperature: 0.3,
          num_predict: 500
        }
      })
    });

    console.log('generateSummaryWithOllama: Response status:', response.status, 'statusText:', response.statusText);
    console.log('generateSummaryWithOllama: Response headers:', [...response.headers.entries()]);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('generateSummaryWithOllama: HTTP error response body:', errorText);
      throw new Error(`Ollama API error: ${response.status} - ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.response;

    console.log('Ollama response received:', content ? 'content present' : 'no content');

    try {
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || 'No summary provided',
        keyPoints: parsed.keyPoints || [],
        model: model
      };
    } catch (parseError) {
      console.warn('Failed to parse JSON from Ollama, using raw content');
      return {
        summary: content || 'Failed to generate summary',
        keyPoints: [],
        model: model
      };
    }
  } catch (error) {
    console.error('Error calling Ollama:', error.message);
    // Return error in a format consistent with GPT handler
    return {
      summary: null,
      keyPoints: [],
      error: error.message
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getOllamaModels, generateSummaryWithOllama };
}