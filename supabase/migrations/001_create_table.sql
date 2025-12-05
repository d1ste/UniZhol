-- Create table for universities
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  country text,
  city text,
  description text,
  raw_json jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ivf_universities_embedding ON universities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
