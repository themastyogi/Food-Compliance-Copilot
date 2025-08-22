export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = JSON.parse(req.body || '{}');
    // demo login check
    if (email === 'admin@example.com' && password === 'admin123') {
      return res.status(200).json({ user: { email, role: 'admin' } });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.status(405).json({ error: 'Method not allowed' });
}
