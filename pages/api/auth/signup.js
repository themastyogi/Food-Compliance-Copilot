import { db, userPublic } from '../_db';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const exists = db.users.find(u => u.email.toLowerCase() === String(email).toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  const user = {
    id: 'u_' + Date.now(),
    name,
    email: String(email).toLowerCase(),
    password,               // TODO: hash me (e.g., bcrypt)
    role: 'explorer',
    queriesUsed: 0,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);

  const token = 't_' + Math.random().toString(36).slice(2);
  db.sessions[token] = user.id;

  res.setHeader('Set-Cookie', `session=${token}; Path=/; SameSite=Lax; HttpOnly`);
  return res.status(200).json({ user: userPublic(user) });
}
