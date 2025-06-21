import type { NextApiRequest, NextApiResponse } from 'next';
import { callTTS } from '../../lib/ttsApi';

export const config = {
  api: {
    responseLimit: false,
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text, voiceId } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });
  try {
    const audioBlob = await callTTS(text, process.env.TTS_API_KEY!, voiceId);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(await audioBlob.arrayBuffer()));
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'TTS failed' });
  }
}
