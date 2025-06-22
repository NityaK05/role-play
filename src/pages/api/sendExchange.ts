import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { callLlama } from '../../lib/llamaApi';

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
    // Build prompt for AI using scenario setup
    const prompt = `You are role-playing as: ${session.aiRole}\nThe user is: ${session.userRole}\nScenario type: ${session.scenarioType}\nContext: ${session.context}\nDifficulty: ${session.difficulty}\n\nConversation so far:\n${exchanges.map(ex => `${ex.speaker}: ${ex.text}`).join('\n')}\n\nRespond as the AI role.`;
    // Call Llama API
    let aiResponse = '';
    try {
      aiResponse = await callLlama(prompt, process.env.LLAMA_API_KEY!);
    } catch (err: any) {
      return res.status(500).json({ error: 'AI API error', details: err?.message || err });
    }
    // Add AI exchange
    const aiExchange = { id: Date.now() + 1, speaker: session.aiRole || 'AI', text: aiResponse, timestamp: new Date().toISOString() };
    const updatedExchanges = [...exchanges, aiExchange];
    // Update session in DB
    await supabase.from('sessions').update({ exchanges: updatedExchanges }).eq('id', sessionId);
    res.status(200).json({ ai: aiResponse, exchanges: updatedExchanges });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Unknown error' });
  }
}
