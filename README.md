# AI‑Replicator‑University (scaffold)

This project is a scaffold for the AI‑Replicator University search (Next.js + Supabase + pgvector + Fireworks embeddings/completions).

**Important:** DO NOT commit or paste your API keys here. Instead copy `.env.example` → `.env` locally and fill the values.

## Quick start

1. Install dependencies:
   ```
   npm install
   ```

2. Copy example env:
   ```
   cp .env.example .env
   ```

3. Fill `.env` with your Supabase + Fireworks (Mistral) credentials.

4. Create the `universities` table in Supabase using `supabase/migrations/001_create_table.sql`.

5. Import CSV embeddings (local script):
   ```
   npm run ingest
   ```

6. Start Next.js:
   ```
   npm run dev
   ```

Open http://localhost:3000/search

