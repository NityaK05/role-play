import type { NextApiRequest, NextApiResponse } from 'next';
import { ACCENTS, AccentOption } from '../../lib/accents';

// Fuzzy accent matching logic using ACCENTS array
function matchAccent(accentQuery: string): AccentOption | null {
  if (!accentQuery) return null;
  const query = accentQuery.toLowerCase();
  // Try exact label match first
  let match = ACCENTS.find(a => a.label.toLowerCase() === query);
  if (match) return match;
  // Try partial label match
  match = ACCENTS.find(a => a.label.toLowerCase().includes(query));
  if (match) return match;
  // Try language code or gender match
  match = ACCENTS.find(a =>
    a.languageCode.toLowerCase().includes(query) ||
    a.gender.toLowerCase() === query
  );
  if (match) return match;
  // Try splitting query and matching all words
  const words = query.split(/\s+/);
  match = ACCENTS.find(a => words.every(w => a.label.toLowerCase().includes(w)));
  if (match) return match;
  return null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const { accentQuery } = req.body;
  if (!accentQuery) {
    res.status(400).json({ error: 'Missing accentQuery' });
    return;
  }
  const match = matchAccent(accentQuery);
  if (!match) {
    res.status(404).json({ error: 'No matching voice found' });
    return;
  }
  res.status(200).json(match);
}
