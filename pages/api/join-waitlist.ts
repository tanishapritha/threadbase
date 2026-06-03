import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Invalid email' });
  }

  if (!supabaseAdmin) {
    console.error('[join-waitlist] supabaseAdmin is null');
    return res.status(500).json({ error: 'Database is not configured' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert([{ email }]);

    if (error) throw error;
    return res.status(200).json({ message: 'Added to waitlist', data });
  } catch (err: any) {
    console.error('[join-waitlist] error', err);
    return res.status(500).json({ error: err.message ?? 'Server error' });
  }
}
