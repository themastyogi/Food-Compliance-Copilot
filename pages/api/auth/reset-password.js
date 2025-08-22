import { db } from '../_db';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = newPassword; // TODO: hash me
  return res.status(200).json({ ok: true });
}
