import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { callLlama } from '../../lib/llamaApi';
import { callTTS } from '../../lib/ttsApi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end();
    const { sessionId, text } = req.body;
    // Get session
    const { data: session, error } = await supabase.from('sessions').select('*').eq('id', sessionId).single();
    if (error || !session) return res.status(404).json({ error: error?.message || 'Session not found' });
    // Add user exchange
    const userExchange = { id: Date.now(), speaker: 'user', text, timestamp: new Date().toISOString() };
    const exchanges = [...(session.exchanges || []), userExchange];
    console.log('User exchange:', userExchange);
    // Llama prompt
    const prompt = `You are role-playing as ${session.aiRole} in a realistic conversation. The user is ${session.userRole}.
Your goal is to stay in character and provide natural, professional, and contextually aware responses.
Speak as a real human would: include natural speech patterns, filler words (like “um”, “hmm”, “let me think”), hesitations, and even occasional coughs or pauses if appropriate.

Context:
${session.context}

Difficulty: ${session.difficulty}

${exchanges.map((ex: any) => `${ex.speaker}: ${ex.text}`).join('\n')}`;
    let aiText = '';
    try {
      aiText = await callLlama(prompt, process.env.LLAMA_API_KEY!);
    } catch (e: any) {
      console.error('Llama API error:', e?.message || e);
      return res.status(500).json({ error: 'Llama API error', details: e?.message || e });
    }
    // Add AI exchange
    const aiExchange = { id: Date.now() + 1, speaker: 'ai', text: aiText, timestamp: new Date().toISOString() };
    exchanges.push(aiExchange);
    console.log('AI exchange:', aiExchange);
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
    const updateResult = await supabase.from('sessions').update({ exchanges }).eq('id', sessionId);
    console.log('Supabase update result:', updateResult);
    res.status(200).json({ aiText, audioUrl });
  } catch (err: any) {
    console.error('sendExchange API error:', err?.message || err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || err });
  }
}
