import { db, userPublic } from '../_db';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || user.password !== password) return res.status(401).json({ error: 'Invalid email or password' });

  const token = 't_' + Math.random().toString(36).slice(2);
  db.sessions[token] = user.id;

  res.setHeader('Set-Cookie', `session=${token}; Path=/; SameSite=Lax; HttpOnly`);
  return res.status(200).json({ user: userPublic(user) });
}
