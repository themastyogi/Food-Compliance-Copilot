// pages/api/chat/index.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages = [] } = req.body || {};

    // Map to OpenAI-style format (adjust if you use a different provider)
    const mapped = messages.map(m => ({
      role: m.role || 'user',
      content: String(m.content ?? ''),
    }));

    // === Call your existing model provider ===
    // If you're using OpenAI:
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // pick your model
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

    // Return exactly what your frontend expects:
    return res.status(200).json({ reply });
  } catch (e) {
    console.error('Chat error:', e);
    return res.status(500).json({ error: 'Chat failed' });
  }
}
