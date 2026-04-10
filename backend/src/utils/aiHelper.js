import axios from 'axios';

/**
 * Centralized helper for calling the Groq AI API
 * @param {string} systemPrompt - Instructions for the AI
 * @param {string} userPrompt - The code or query to analyze
 * @param {number} temperature - Creativity/Deterministic control (default 0.2)
 * @param {number} maxTokens - Output limit
 * @returns {Promise<string>} - The AI generated response
 */
export const callGroq = async (systemPrompt, userPrompt, temperature = 0.2, maxTokens = 2000) => {
  const groqApiKey = process.env.GROQ_API_KEY;
  
  if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
    throw new Error('Groq API Key is not configured on the server.');
  }

  const startTime = Date.now();
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  }, {
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  const responseTimeMs = Date.now() - startTime;
  const data = response.data;

  return {
    content: data.choices[0]?.message?.content || '',
    usage: data.usage || {},
    responseTimeMs
  };
};
