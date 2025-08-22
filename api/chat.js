// /pages/api/chat.js — Fixed for Next.js
const SYSTEM_PROMPT = `
You are "Food Compliance Copilot", a food compliance advisor for global food safety and labeling rules (FDA, FSMA, HACCP, FSSAI, EU FIC, Codex).
Default to Free Q&A unless the user types "menu" (then present Menu Mode as specified).
Always emphasize allergen risks, avoid brand promotion, no legal advice.
For image validation: classify findings into Critical non-compliance, Moderate risk, Minor improvement.
Always append:
"This is compliance guidance only, not legal advice. Verify with official regulations and professionals before final decisions."
"Contact: themastyogi@gmail.com"
`;

export default async function handler(req, res) {
  // CORS (ok for same-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    // Defensive body parsing
    let body = req.body;
    if (typeof body === 'string') {
      try { 
        body = JSON.parse(body); 
      } catch (error) { 
        console.error('JSON parse error:', error);
        body = {}; 
      }
    }
    body = body || {};

    // Accept { messages } or { message }
    let { messages } = body;
    if (!messages && body.message) {
      const single = String(body.message || '').trim();
      if (!single) return res.status(400).json({ error: 'Message required' });
      messages = [{ role: 'user', content: single }];
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({ error: 'Invalid message format' });
      }
    }

    // Use fetch (Node 18/20 compatible)
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 2000,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => 'Unknown error');
      console.error('OpenAI HTTP error:', resp.status, errText);
      return res.status(500).json({ 
        error: 'OpenAI API error', 
        details: `Status: ${resp.status}` 
      });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Server error:', err?.message || err);
    return res.status(500).json({ 
      error: 'Service temporarily unavailable',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
