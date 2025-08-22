import { db } from '../_db';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const cookie = req.headers.cookie || '';
  const token = (cookie.match(/(?:^|;\s*)session=([^;]+)/) || [])[1];
  if (token) delete db.sessions[token];

  res.setHeader('Set-Cookie', 'session=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly');
  return res.status(200).json({ ok: true });
}
