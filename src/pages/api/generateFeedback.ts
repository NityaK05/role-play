import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { callLlama } from '../../lib/llamaApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { sessionId } = req.body;
  // Get transcript for session
  const { data, error } = await supabase.from('sessions').select('exchanges').eq('id', sessionId).single();
  if (error || !data) return res.status(404).json({ error: error?.message || 'Session not found' });
  const transcript = data.exchanges.map((ex: any) => `${ex.speaker}: ${ex.text}`).join('\n');
  // Feedback prompt
  const prompt = `Act as a communication coach. Based on the following transcript, give the user constructive feedback. Include strengths and 2–3 areas to improve related to tone, clarity, confidence, or persuasiveness.\n\nTranscript:\n${transcript}`;
  let feedback = '';
  try {
    feedback = await callLlama(prompt, process.env.LLAMA_API_KEY!);
  } catch (e: any) {
    return res.status(500).json({ error: 'Llama API error', details: e?.message || e });
  }
  // Save feedback to session
  await supabase.from('sessions').update({ feedback }).eq('id', sessionId);
  res.status(200).json({ feedback });
}
