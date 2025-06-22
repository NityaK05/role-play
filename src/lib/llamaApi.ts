import axios from 'axios';

/**
 * Calls Meta's Llama 4 API with a user prompt.
 * @param prompt - The user message string to send to the model.
 * @param apiKey - Your Meta Llama API key.
 * @param opts - Optional overrides for max_completion_tokens and temperature.
 * @returns The model's response as a string.
 */
export async function callLlama(
  prompt: string,
  apiKey: string,
  opts?: { max_completion_tokens?: number; temperature?: number }
): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.llama.com/v1/chat/completions', // ✅ Correct endpoint
      {
        model: 'Llama-4-Maverick-17B-128E-Instruct-FP8', // ✅ Latest preferred model
        messages: [
          {
            role: 'user',
            content: prompt + '\n(Respond in a friendly, casual, and informal way. Avoid stiff or overly formal language. Use contractions and natural phrasing. Always finish your sentence and thought, and only say meaningful, personal things. Do not cut off your response.)',
          },
        ],
        max_completion_tokens: opts?.max_completion_tokens ?? 48, // allow a bit more for full sentences
        temperature: opts?.temperature ?? 0.35, // slightly higher for more natural, but still fast
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return (
      response.data.completion_message.content.text ||
      response.data.completion_message.content ||
      response.data.choices?.[0]?.message?.content ||
      ''
    );
  } catch (error: any) {
    throw new Error('Llama API error: ' + (error?.response?.data?.error?.message || error?.message || 'Unknown error'));
  }
}
