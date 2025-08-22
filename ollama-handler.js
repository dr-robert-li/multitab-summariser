async function getOllamaModels() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }
    
    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error('Error fetching Ollama models:', error);
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
    console.log('Sending request to Ollama at http://localhost:11434/api/generate');
    const response = await fetch('http://localhost:11434/api/generate', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Ollama API error:', response.status, errorText);
      throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
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