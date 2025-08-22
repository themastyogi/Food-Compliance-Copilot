import { db, userPublic } from '../_db';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages } = req.body || {};
  const lastUser = (messages || []).filter(m => m.role === 'user').slice(-1)[0]?.content || '';
  const reply = `You said: ${lastUser}\n\n(This is a stub. Connect your model in /api/chat.)`;

  // bump queriesUsed for the logged-in user
  const cookie = req.headers.cookie || '';
  const token = (cookie.match(/(?:^|;\s*)session=([^;]+)/) || [])[1];
  const userId = token && db.sessions[token];
  let user = db.users.find(u => u.id === userId);
  if (user) user.queriesUsed = (user.queriesUsed || 0) + 1;

  return res.status(200).json({ reply, user: userPublic(user) });
}
