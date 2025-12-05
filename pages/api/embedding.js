import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const resp = await fetch(`${process.env.FIREWORKS_URL}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIREWORKS_KEY}`,
      },
      body: JSON.stringify({ model: process.env.EMBEDDING_MODEL, input: text }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      return res.status(500).json({ error: 'Fireworks embedding failed', detail: t });
    }
    const j = await resp.json();
    const embedding = j.data?.[0]?.embedding;
    return res.status(200).json({ embedding });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
