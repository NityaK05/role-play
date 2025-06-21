import type { NextApiRequest, NextApiResponse } from 'next';
import { callWhisper } from '../../lib/whisperApi';
import { Readable } from 'stream';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false, // We'll handle multipart/form-data
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });
  let audioBuffer: Buffer[] = [];
  let fileType = 'audio/webm';
  bb.on('file', (name: string, file: any, info: any) => {
    if (info && info.mimeType) fileType = info.mimeType;
    file.on('data', (data: Buffer) => audioBuffer.push(data));
  });
  bb.on('finish', async () => {
    const fullBuffer = Buffer.concat(audioBuffer);
    // Use form-data to send to Whisper
    const form = new FormData();
    form.append('file', fullBuffer, { filename: 'audio.webm', contentType: fileType });
    form.append('model', 'whisper-1');
    try {
      const axios = require('axios');
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.WHISPER_API_KEY}`,
        },
      });
      res.status(200).json({ text: response.data.text });
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'Whisper transcription failed' });
    }
  });
  req.pipe(bb);
}
