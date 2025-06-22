import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { scenarioType, userRole, aiRole, context, difficulty } = req.body;
  const sessionId = uuidv4();
  const { data, error } = await supabase.from('sessions').insert([
    {
      id: sessionId,
      scenarioType,
      userRole,
      aiRole,
      context,
      difficulty,
      exchanges: [],
      createdAt: new Date().toISOString(),
    },
  ]);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ sessionId });
}
