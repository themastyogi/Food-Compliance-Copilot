let users = [
  { id: 1, email: 'admin@example.com', name: 'Admin User', role: 'admin', queriesUsed: 0, createdAt: new Date().toISOString() },
  { id: 2, email: 'explorer@example.com', name: 'Explorer User', role: 'explorer', queriesUsed: 2, createdAt: new Date().toISOString() },
  { id: 3, email: 'pro@example.com', name: 'Pro User', role: 'pro', queriesUsed: 15, createdAt: new Date().toISOString() }
];

// Vercel serverless function
export default function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const newUser = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
    users.push(newUser);
    return res.status(201).json(newUser);
  }

  if (req.method === 'PUT') {
    const { id, role } = req.body;
    users = users.map(u => (u.id === id ? { ...u, role } : u));
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
