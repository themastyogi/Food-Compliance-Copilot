// pages/api/chat/index.js
import { withSessionRoute } from '../_session';
import { ensureCsrf, requireCsrf } from '../_csrf';

export default withSessionRoute(async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await ensureCsrf(req);
  if (!requireCsrf(req, res)) return;

  try {
    const { messages = [] } = req.body || {};

    const mapped = messages.map(m => ({
      role: m.role || 'user',
      content: String(m.content ?? ''),
    }));

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: mapped.length ? mapped : [{ role: 'user', content: 'Hello' }],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('OpenAI error', resp.status, text);
      return res.status(500).json({ error: 'Chat failed' });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Optional: track queriesUsed in session (no DB yet)
    req.session.queriesUsed = (req.session.queriesUsed || 0) + 1;
    await req.session.save?.();

    // You can return a minimal user payload if your UI uses it (optional)
    const user = req.session.userId
      ? { id: req.session.userId, role: 'explorer', queriesUsed: req.session.queriesUsed }
      : undefined;

    return res.status(200).json({ reply, ...(user ? { user } : {}) });
  } catch (e) {
    console.error('Chat error:', e);
    return res.status(500).json({ error: 'Chat failed' });
  }
});
