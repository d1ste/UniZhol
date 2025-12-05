import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function rerankWithLLM(userQuery, candidates) {
  const prompt = `Пользователь запросил: "${userQuery}"\n\nДаны кандидаты (университеты):\n${candidates.map((c, i) => `${i+1}. ${c.name} — ${c.description ? c.description.slice(0,200) : ''}`).join('\n\n')}\n\nЗадача: верни JSON массив top-3 объектов с полями {id, name, score, reason}. Сортировать по релевантности.`;
  const resp = await fetch(`${process.env.FIREWORKS_URL}/v1/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FIREWORKS_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.RERANK_MODEL,
      prompt,
      max_tokens: 512,
      temperature: 0.0,
    }),
  });
  const j = await resp.json();
  const text = j.choices?.[0]?.text || j.output || '';
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    // fallback
    return candidates.slice(0,3).map((c, idx) => ({ id: c.id, name: c.name, score: 1 - idx*0.1, reason: 'Auto-ranked fallback' }));
  }
}

export default async function handler(req, res) {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    // 1) embedding
    const embResp = await fetch(`${process.env.FIREWORKS_URL}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIREWORKS_KEY}`,
      },
      body: JSON.stringify({ model: process.env.EMBEDDING_MODEL, input: query }),
    });
    const embJson = await embResp.json();
    const queryEmbedding = embJson.data?.[0]?.embedding;
    if (!queryEmbedding) return res.status(500).json({ error: 'Failed to get query embedding' });

    // 2) vector search in Supabase using SQL function match_universities (recommended)
    // This assumes you created the SQL function in supabase/migrations/001_create_function.sql
    const { data, error } = await supabase.rpc('match_universities', { q_embedding: queryEmbedding, limit: 5 });
    const candidates = data || [];

    // 3) rerank
    const reranked = await rerankWithLLM(query, candidates);

    return res.status(200).json({ results: reranked });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e) });
  }
}
