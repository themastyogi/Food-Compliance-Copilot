import { db, userPublic } from '../_db';

export default function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const { userId, role } = req.body || {};
  if (!userId || !role) return res.status(400).json({ error: 'Missing fields' });

  // TODO: enforce admin-only
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = role;
  return res.status(200).json({ user: userPublic(user) });
}
