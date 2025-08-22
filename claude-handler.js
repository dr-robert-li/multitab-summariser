// Handler for Anthropic Claude API
async function generateSummaryWithClaude(textContent, screenshot, title, url, apiKey, model = 'claude-3-5-sonnet-20241022') {
  console.log('generateSummaryWithClaude called with model:', model);
  
  if (!apiKey) {
    console.error('No API key provided to Claude');
    return {
      summary: 'Please provide your Anthropic API key',
      keyPoints: [],
      error: 'No API key provided'
    };
  }

  try {
    // Prepare the messages array
    const messages = [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analyze this web page and create a helpful summary.

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
        }
      ]
    }];

    // Add screenshot if available
    if (screenshot) {
      messages[0].content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: screenshot.replace(/^data:image\/\w+;base64,/, '')
        }
      });
    }

    console.log('generateSummaryWithClaude: Sending request to Anthropic API');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1024,
        temperature: 0.3,
        messages: messages
      })
    });

    console.log('generateSummaryWithClaude: Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('generateSummaryWithClaude: API error:', errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Claude response received');

    // Extract the text content from Claude's response
    const content = data.content?.[0]?.text || '';

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
      console.warn('Failed to parse JSON from Claude, using raw content');
      return {
        summary: content || 'Failed to generate summary',
        keyPoints: [],
        model: model
      };
    }
  } catch (error) {
    console.error('Error calling Claude:', error.message);
    return {
      summary: null,
      keyPoints: [],
      error: error.message
    };
  }
}

// Available Claude models
const CLAUDE_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Powerful)' },
  { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateSummaryWithClaude, CLAUDE_MODELS };
}