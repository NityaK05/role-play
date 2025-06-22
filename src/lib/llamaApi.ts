import axios from 'axios';

/**
 * Calls Meta's Llama 4 API with a user prompt.
 * @param prompt - The user message string to send to the model.
 * @param apiKey - Your Meta Llama API key.
 * @returns The model's response as a string.
 */
export async function callLlama(prompt: string, apiKey: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.llama.com/v1/chat/completions', // ✅ Correct endpoint
      {
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8', // ✅ Latest preferred model
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_completion_tokens: 1024, // ✅ Correct param name per docs
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.completion_message.content.text;
  } catch (error: any) {
    console.error('Llama API error:', error?.response?.data || error?.message || error);
    throw new Error('Llama API error: ' + (error?.response?.data?.error?.message || error?.message || 'Unknown error'));
  }
}
