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
    // Remove or comment out these lines to stop logging user/AI exchanges
    // console.log('User exchange:', userExchange);
    // Detect formality (simple heuristic)
    const isFormal = /interview|presentation|investor|manager|boss|formal|professional|business|client|customer|negotiation|review/i.test(session.scenarioType + ' ' + session.context + ' ' + session.difficulty);
    const prompt = `You are role-playing as ${session.aiRole} in a realistic conversation. The user is ${session.userRole}.
Your goal is to stay in character and provide natural, professional, and contextually aware responses.
Speak as a real human would: include natural speech patterns, filler words (like “um”, “hmm”, “let me think”), hesitations, and even occasional coughs or pauses if appropriate.
${isFormal ? 'This is a formal scenario. Respond professionally and with appropriate length.' : 'This is an informal scenario. Respond briefly, casually, and keep it short. Use informal language and be friendly.'}
IMPORTANT: If you see any text in parentheses or surrounded by asterisks (like (chuckles) or *smiling*), do NOT say the words out loud. Instead, act out the sound or emotion as a human would, or skip it in your spoken response.

Context:
${session.context}

Difficulty: ${session.difficulty}

${exchanges.map((ex: any) => `${ex.speaker}: ${ex.text}`).join('\n')}`;
    let aiText = '';
    let sfxCues: string[] = [];
    const llamaStart = Date.now();
    try {
      // Lower max_completion_tokens and temperature for speed
      aiText = await callLlama(prompt, process.env.LLAMA_API_KEY!, { max_completion_tokens: 64, temperature: 0.3 });
      // Extract SFX cues (parentheses or asterisks, e.g. (chuckles), *laughs*)
      const sfxMatches = aiText.match(/([(*][^)*]+[*)])/g) || [];
      // Only allow real SFX cues
      const ALLOWED_SFX = ['chuckles', 'laughs', 'coughs', 'sighs', 'clears throat'];
      sfxCues = sfxMatches
        .map(s => s.replace(/^[(*]+|[*)]+$/g, '').trim().toLowerCase())
        .filter(cue => ALLOWED_SFX.includes(cue));
      // Remove all SFX cues from the text for TTS and spoken response
      aiText = aiText.replace(/([(*][^)*]+[*)])/g, '').replace(/\[SFX:[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
    } catch (e: any) {
      console.error('Llama API error:', e?.message || e);
      return res.status(500).json({ error: 'Llama API error', details: e?.message || e });
    }
    const llamaEnd = Date.now();
    // Add AI exchange
    const aiExchange = { id: Date.now() + 1, speaker: 'ai', text: aiText, timestamp: new Date().toISOString() };
    exchanges.push(aiExchange);
    // Remove or comment out these lines to stop logging user/AI exchanges
    // console.log('AI exchange:', aiExchange);
    // Generate TTS audio (only for text, not SFX)
    let audioUrl = '';
    const ttsStart = Date.now();
    try {
      // Remove [SFX:cue] markers for TTS
      const ttsText = aiText.replace(/\[SFX:[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
      const audioBlob = await callTTS(ttsText, process.env.TTS_API_KEY!);
      // In production, upload to S3 or Supabase Storage and get a URL
      // For now, skip upload and return empty string
    } catch (e) {
      // fallback: no audio
    }
    const ttsEnd = Date.now();
    console.log(`Llama time: ${llamaEnd - llamaStart}ms, TTS time: ${ttsEnd - ttsStart}ms`);
    // Update session
    const updateResult = await supabase.from('sessions').update({ exchanges }).eq('id', sessionId);
    console.log('Supabase update result:', updateResult);
    res.status(200).json({ aiText, audioUrl, sfxCues });
  } catch (err: any) {
    console.error('sendExchange API error:', err?.message || err);
    res.status(500).json({ error: 'Internal server error', details: err?.message || err });
  }
}