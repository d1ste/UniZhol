/**
 * Node.js ingest script.
 * Usage: NODE_ENV=production node scripts/ingest_universities.js
 *
 * This script reads CSV (path from .env CSV_PATH), generates embeddings via Fireworks,
 * and inserts rows into Supabase table `universities`.
 *
 * IMPORTANT: Fill .env with SUPABASE_KEY (service role recommended) and FIREWORKS_KEY.
 */
import fs from 'fs';
import csv from 'csv-parser';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const FIREWORKS_URL = process.env.FIREWORKS_URL;
const FIREWORKS_KEY = process.env.FIREWORKS_KEY;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'mistral-embedding-001';
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM) || 1536;
const CSV_PATH = process.env.CSV_PATH || './data/kz_universities_top25_expanded.csv';

if (!SUPABASE_URL || !SUPABASE_KEY || !FIREWORKS_URL || !FIREWORKS_KEY) {
  console.error('Set SUPABASE_URL, SUPABASE_KEY, FIREWORKS_URL and FIREWORKS_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function concatRowToDescription(row) {
  const parts = [];
  if (row.name) parts.push(`Университет: ${row.name}`);
  if (row.directions) parts.push(`Направления: ${row.directions}`);
  if (row.exchange) parts.push(`Обмен: ${row.exchange}`);
  if (row.housing) parts.push(`Проживание: ${row.housing}`);
  if (row.infra) parts.push(`Инфраструктура: ${row.infra}`);
  if (row.notes) parts.push(`Прочее: ${row.notes}`);
  return parts.join('\n');
}

async function generateEmbedding(text) {
  const resp = await fetch(`${FIREWORKS_URL}/v1/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIREWORKS_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error('Embedding request failed: ' + t);
  }
  const j = await resp.json();
  return j.data[0].embedding;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV not found at', CSV_PATH);
    process.exit(1);
  }
  const rows = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log('Loaded', rows.length, 'rows');
  for (const row of rows) {
    try {
      const description = concatRowToDescription(row);
      const embedding = await generateEmbedding(description);
      const payload = {
        name: row.name || row.university || 'Unknown',
        short_name: row.short_name || null,
        country: row.country || null,
        city: row.city || null,
        description,
        raw_json: row,
        embedding,
      };
      const { data, error } = await supabase.from('universities').insert([payload]);
      if (error) console.error('Supabase insert error', error);
      else console.log('Inserted', payload.name);
    } catch (e) {
      console.error('Error', e);
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
