import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { id } = req.query;
  const { format } = req.query;
  const { data, error } = await supabase.from('sessions').select('exchanges').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Session not found' });
  if (format === 'txt') {
    const txt = data.exchanges.map((ex: any) => `${ex.speaker}: ${ex.text}`).join('\n');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="transcript-${id}.txt"`);
    return res.send(txt);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="transcript-${id}.json"`);
    return res.json(data.exchanges);
  }
}
