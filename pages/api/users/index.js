import { db, userPublic } from '../_db';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // TODO: check admin session
  const users = db.users.map(userPublic);
  return res.status(200).json({ users });
}
