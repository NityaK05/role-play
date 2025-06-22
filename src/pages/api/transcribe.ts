// This endpoint now uses AWS Transcribe for STT. Formerly /api/whisper.
import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { v4 as uuidv4 } from 'uuid';
import { IncomingForm, Files } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;
const s3 = new S3Client({ region: REGION });
const transcribe = new TranscribeClient({ region: REGION });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = new IncomingForm();
  form.parse(req, async (err: any, fields: any, files: Files) => {
    if (res.headersSent) return;
    if (err) {
      console.error('Formidable parse error:', err);
      if (!res.headersSent) return res.status(500).json({ error: 'File upload error', details: err });
    }
    let fileObj = files.file as any;
    if (Array.isArray(fileObj)) fileObj = fileObj[0];
    if (!fileObj) {
      console.error('No file uploaded');
      if (!res.headersSent) return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileStream = fs.createReadStream(fileObj.filepath);
    const key = `audio/${uuidv4()}.webm`;
    try {
      // Upload to S3
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileStream,
        ContentType: fileObj.mimetype || 'audio/webm',
      }));
      const s3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
      // Start Transcribe job
      const jobName = `transcribe-${uuidv4()}`;
      await transcribe.send(new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: 'en-US',
        MediaFormat: 'webm',
        Media: { MediaFileUri: s3Url },
        OutputBucketName: BUCKET,
      }));
      // Poll for result
      let transcript = '';
      for (let i = 0; i < 30; i++) {
        const result = await transcribe.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
        const job = result.TranscriptionJob;
        if (job && job.TranscriptionJobStatus === 'COMPLETED' && job.Transcript && job.Transcript.TranscriptFileUri) {
          const outputUrl = job.Transcript.TranscriptFileUri;
          const resp = await fetch(outputUrl);
          const contentType = resp.headers.get('content-type');
          let data;
          if (contentType && contentType.includes('application/json')) {
            data = await resp.json();
          } else {
            const text = await resp.text();
            try {
              data = JSON.parse(text);
            } catch {
              console.error('Transcribe output not JSON:', text);
              if (!res.headersSent) return res.status(500).json({ error: 'Transcribe output not JSON', details: text });
            }
          }
          if (data && data.results && data.results.transcripts && data.results.transcripts[0]) {
            transcript = data.results.transcripts[0].transcript;
          } else {
            console.error('Transcript not found in AWS response:', JSON.stringify(data, null, 2));
            if (!res.headersSent) return res.status(500).json({ error: 'Transcript not found in AWS response', details: data });
          }
          break;
        } else if (job && job.TranscriptionJobStatus === 'FAILED') {
          console.error('Transcription job failed:', JSON.stringify(job, null, 2));
          if (!res.headersSent) return res.status(500).json({ error: 'Transcription failed', details: job });
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      if (!transcript) {
        console.error('Transcript is empty after polling');
        if (!res.headersSent) return res.status(500).json({ error: 'Transcript is empty after polling' });
      }
      if (!res.headersSent) res.status(200).json({ text: transcript });
    } catch (e: any) {
      console.error('AWS Transcribe error (outer catch):', e);
      if (!res.headersSent) return res.status(500).json({ error: e?.message || 'AWS Transcribe failed', details: e });
    }
    if (!res.headersSent) res.status(500).json({ error: 'Unknown error in /api/transcribe' });
  });
}