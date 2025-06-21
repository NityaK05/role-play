import axios from 'axios';

export async function callLlama(prompt: string, apiKey: string) {
  const response = await axios.post(
    'https://api.llama-api.com/v1/chat/completions',
    {
      model: 'llama-4',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 256,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
}
