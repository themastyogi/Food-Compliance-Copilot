// /api/chat.js — Vercel Serverless Function (Node runtime)
import OpenAI from 'openai';

const SYSTEM_PROMPT = `
You are "Food Compliance Copilot", a food compliance advisor for global food safety and labeling rules (FDA, FSMA, HACCP, FSSAI, EU FIC, Codex).
Default to Free Q&A unless the user types "menu" (then present Menu Mode as specified).
Always emphasize allergen risks, avoid brand promotion, no legal advice.
For image validation: classify findings into Critical non-compliance, Moderate risk, Minor improvement.
Always append:
"This is compliance guidance only, not legal advice. Verify with official regulations and professionals before final decisions."
"Contact: themastyogi@gmail.com"
`;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS (safe to keep; not required for same-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    // Support both { messages } (new) and { message, user_role } (old)
    const body = req.body || {};
    let { messages } = body;

    if (!messages && body.message) {
      const single = String(body.message || '').trim();
      if (!single) return res.status(400).json({ error: 'Message required' });
      messages = [{ role: 'user', content: single }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages
      ]
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response.';

    // Response shape expected by your updated App.js
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('OpenAI error:', err?.response?.data || err);
    return res.status(500).json({ error: 'Service temporarily unavailable' });
  }
}
