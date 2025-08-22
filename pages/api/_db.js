// pages/api/_db.js
export const db = {
  users: [
    { id: 'u_demo', name: 'Demo User', email: 'demo@example.com', password: 'demo', role: 'explorer', queriesUsed: 0, createdAt: new Date().toISOString() },
    { id: 'u_pro',  name: 'Pro User',  email: 'pro@example.com',  password: 'pro',  role: 'pro',      queriesUsed: 12, createdAt: new Date().toISOString() },
    { id: 'u_admin',name: 'Admin',     email: 'admin@example.com',password: 'admin',role: 'admin',    queriesUsed: 99, createdAt: new Date().toISOString() },
  ],
  // very naive session store keyed by fake token
  sessions: {}, // token -> userId
};

export function userPublic(u) {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
}
