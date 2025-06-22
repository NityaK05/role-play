import axios from 'axios';

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (ElevenLabs default, very natural)

export async function callTTS(text: string, apiKey: string, voiceId: string = DEFAULT_VOICE_ID) {
  // Remove parenthetical/asterisked cues for TTS (should not be spoken)
  const cleanText = text
    .replace(/\*[^*]+\*/g, '') // remove *asterisked*
    .replace(/\([^)]*\)/g, '') // remove (parenthetical)
    .replace(/\s+/g, ' ').trim();

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      text: cleanText,
      voice_settings: {
        stability: 0.3, // lower = more expressive
        similarity_boost: 0.8, // higher = more like the base voice
        style: 0.7, // more conversational
        use_speaker_boost: true
      }
    },
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