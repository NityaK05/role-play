import axios from 'axios';

export async function callWhisper(audioBlob: Blob, apiKey: string) {
  // Convert Blob to File for FormData
  const file = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', 'whisper-1');
  const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.text;
}
