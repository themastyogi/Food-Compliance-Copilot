// api/chat.js - This runs on Vercel's servers (secure)
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, user_role } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Your HF Space URL (secure - only on server)
    const HF_SPACE_URL = process.env.HF_SPACE_URL; // From Vercel environment variables
    
    if (!HF_SPACE_URL) {
      return res.status(500).json({ error: 'Service not configured' });
    }

    // Call your HF Space
    const response = await fetch(`${HF_SPACE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message.trim(),
        user_role: user_role
      })
    });

    if (!response.ok) {
      throw new Error(`HF Space error: ${response.status}`);
    }

    const result = await response.json();
    
    // Return response (adjust based on your HF Space's response format)
    const botResponse = result.response || result.message || result.reply || 'No response';
    
    res.json({ 
      response: botResponse,
      success: true 
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Service temporarily unavailable' 
    });
  }
}
