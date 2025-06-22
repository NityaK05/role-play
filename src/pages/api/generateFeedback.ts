// This endpoint is deprecated and intentionally returns 404.
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(404).json({ error: 'Not found' });
}
