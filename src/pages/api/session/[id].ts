import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const { id } = req.query;
  const { data, error } = await supabase.from('sessions').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Session not found' });
  res.status(200).json(data);
}
