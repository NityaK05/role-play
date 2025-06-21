import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { callLlama } from '../../lib/llamaApi';
import { callTTS } from '../../lib/ttsApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { sessionId, text } = req.body;
  // Get session
  const { data: session, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
  if (error || !session) return res.status(404).json({ error: error?.message || 'Session not found' });
  // Add user exchange
  const userExchange = { id: Date.now(), speaker: 'user', text, timestamp: new Date().toISOString() };
  const exchanges = [...(session.exchanges || []), userExchange];
  // Llama prompt
  const prompt = `You are role-playing as ${session.aiRole} in a realistic conversation. The user is ${session.userRole}.\nYour goal is to stay in character and provide natural, professional, and contextually aware responses.\n\nContext:\n${session.context}\n\nDifficulty: ${session.difficulty}\n\n${exchanges.map((ex: any) => `${ex.speaker}: ${ex.text}`).join('\n')}`;
  const aiText = await callLlama(prompt, process.env.LLAMA_API_KEY!);
  // Add AI exchange
  const aiExchange = { id: Date.now() + 1, speaker: 'ai', text: aiText, timestamp: new Date().toISOString() };
  exchanges.push(aiExchange);
  // Generate TTS audio
  let audioUrl = '';
  try {
    const audioBlob = await callTTS(aiText, process.env.TTS_API_KEY!);
    // In production, upload to S3 or Supabase Storage and get a URL
    // For now, skip upload and return empty string
  } catch (e) {
    // fallback: no audio
  }
  // Update session
  await supabase.from('sessions').update({ exchanges }).eq('id', sessionId);
  res.status(200).json({ aiText, audioUrl });
}
