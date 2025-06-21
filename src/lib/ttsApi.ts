import axios from 'axios';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (ElevenLabs default)

export async function callTTS(text: string, apiKey: string, voiceId: string = DEFAULT_VOICE_ID) {
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    { text },
    {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
    }
  );
  // Return audio as a Blob for playback
  return new Blob([response.data], { type: 'audio/mpeg' });
}
