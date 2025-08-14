// GPT-5 API handler with fallback to GPT-4 Vision

async function generateSummaryWithGPT5(textContent, screenshot, title, url, apiKey) {
  // Try GPT-5 first, then fallback to GPT-4 Vision
  const models = [
    { 
      name: 'gpt-5',
      endpoint: 'https://api.openai.com/v1/responses',
      useResponsesAPI: true,
      supportsVision: true
    },
    { 
      name: 'gpt-4o',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      useResponsesAPI: false,
      supportsVision: true
    },
    { 
      name: 'gpt-4o-mini',
      endpoint: 'https://api.openai.com/v1/chat/completions',
      useResponsesAPI: false,
      supportsVision: true
    }
  ];

  for (const model of models) {
    try {
      console.log(`Trying model: ${model.name}`);
      const result = await callModel(model, textContent, screenshot, title, url, apiKey);
      console.log(`Success with model: ${model.name}`);
      return result;
    } catch (error) {
      console.warn(`Model ${model.name} failed:`, error.message);
      
      // If it's an auth error, don't try other models
      if (error.message.includes('401') || error.message.includes('invalid')) {
        throw error;
      }
      
      // Continue to next model
      continue;
    }
  }
  
  throw new Error('All models failed to generate summary');
}

async function callModel(model, textContent, screenshot, title, url, apiKey) {
  const inputText = `Analyze this web page and create a helpful summary.

Page Title: ${title}
URL: ${url}
${textContent ? `Text Content (first 3000 chars): ${textContent}` : 'No text content available - please analyze the screenshot if provided'}

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

  let requestBody;
  
  if (model.useResponsesAPI) {
    // GPT-5 Responses API format
    requestBody = {
      model: model.name,
      input: inputText,
      reasoning: {
        effort: "minimal"
      },
      text: {
        verbosity: "medium"
      }
    };
    
    // Note: Screenshots with Responses API might need different handling
    // For now, include text description if screenshot exists
    if (screenshot) {
      requestBody.input += "\n\nNote: A screenshot of the page is available for analysis.";
    }
  } else {
    // Traditional Chat Completions API format
    requestBody = {
      model: model.name,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, informative summaries of web pages. Focus on the main content, key points, and actionable information."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: inputText
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    };

    // Add screenshot for vision models
    if (screenshot && model.supportsVision) {
      requestBody.messages[1].content.push({
        type: "image_url",
        image_url: {
          url: screenshot,
          detail: "low"  // Use low detail to save tokens
        }
      });
    }
  }

  const response = await fetch(model.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${model.name} API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`=== RAW API Response from ${model.name} ===`);
  console.log('Full response object:', JSON.stringify(data, null, 2));
  console.log('=== End Raw Response ===');
  
  // Extract content based on API format
  let content;
  if (model.useResponsesAPI) {
    content = data.output?.text || data.text || '';
  } else {
    content = data.choices?.[0]?.message?.content || '';
  }

  console.log('Extracted content:', content);

  // If content is empty, return an error
  if (!content || content.trim() === '') {
    console.error('Empty content received from API');
    return {
      summary: 'No summary generated - empty response from API',
      keyPoints: [],
      model: model.name,
      error: 'Empty response'
    };
  }

  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || 'No summary provided',
      keyPoints: parsed.keyPoints || [],
      model: model.name
    };
  } catch (parseError) {
    // If JSON parsing fails, try to extract from formatted text
    console.warn('Failed to parse JSON, trying alternative formats');
    
    // Check if it's a JSON code block
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          summary: parsed.summary || 'No summary provided',
          keyPoints: parsed.keyPoints || [],
          model: model.name
        };
      } catch (e) {
        console.warn('Failed to parse JSON from code block');
      }
    }
    
    // If all else fails, use the content as the summary
    const cleanContent = content.replace(/```[\s\S]*?```/g, '').trim();
    
    return {
      summary: cleanContent || 'Failed to generate summary',
      keyPoints: [],
      model: model.name
    };
  }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateSummaryWithGPT5 };
}