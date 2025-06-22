import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    // Google Cloud TTS: fetch voices
    const apiKey = process.env.TTS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'No TTS API key set' });
    const response = await axios.get(
      `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`
    );
    // Map to { label, voiceId, languageCode, gender } for dropdown
    const voices = (response.data.voices || []).map((v: any) => ({
      label: `${v.name} (${v.languageCodes[0]})${v.ssmlGender ? ' ' + v.ssmlGender : ''}`,
      voiceId: v.name,
      languageCode: v.languageCodes[0],
      gender: v.ssmlGender,
    }));
    res.status(200).json({ voices });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to fetch voices' });
  }
}
