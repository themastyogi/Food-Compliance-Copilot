import { db, userPublic } from '../_db';

export default function handler(req, res) {
  const cookie = req.headers.cookie || '';
  const token = (cookie.match(/(?:^|;\s*)session=([^;]+)/) || [])[1];
  const userId = token && db.sessions[token];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(401).json({ error: 'Session invalid' });

  return res.status(200).json(userPublic(user));
}
