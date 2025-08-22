// Handler for Perplexity Sonar API
async function generateSummaryWithPerplexity(textContent, screenshot, title, url, apiKey, model = 'sonar') {
  console.log('generateSummaryWithPerplexity called with model:', model);
  
  if (!apiKey) {
    console.error('No API key provided to Perplexity');
    return {
      summary: 'Please provide your Perplexity API key',
      keyPoints: [],
      error: 'No API key provided'
    };
  }

  try {
    // Prepare the messages
    const messages = [{
      role: 'system',
      content: 'You are a helpful assistant that analyzes web pages and creates concise summaries. Always respond with valid JSON only.'
    }, {
      role: 'user',
      content: `Analyze this web page and create a helpful summary.

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

Important: Return ONLY the JSON object, no additional text or formatting.`
    }];

    console.log('generateSummaryWithPerplexity: Sending request to Perplexity API');
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.3,
        max_tokens: 1024,
        stream: false
      })
    });

    console.log('generateSummaryWithPerplexity: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('generateSummaryWithPerplexity: API error:', errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Perplexity response received');

    // Extract the content from Perplexity's response
    const content = data.choices?.[0]?.message?.content || '';

    try {
      // Try to parse as JSON
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || 'No summary provided',
        keyPoints: parsed.keyPoints || [],
        model: model
      };
    } catch (parseError) {
      // If not JSON, use the raw content
      console.warn('Failed to parse JSON from Perplexity, using raw content');
      return {
        summary: content || 'Failed to generate summary',
        keyPoints: [],
        model: model
      };
    }
  } catch (error) {
    console.error('Error calling Perplexity:', error.message);
    return {
      summary: null,
      keyPoints: [],
      error: error.message
    };
  }
}

// Available Perplexity models
const PERPLEXITY_MODELS = [
  { id: 'sonar', name: 'Sonar (Latest)' },
  { id: 'sonar-pro', name: 'Sonar Pro (Advanced)' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateSummaryWithPerplexity, PERPLEXITY_MODELS };
}