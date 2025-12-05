CREATE OR REPLACE FUNCTION public.match_universities(q_embedding vector, limit int)
RETURNS TABLE(id uuid, name text, description text, raw_json jsonb, distance float)
LANGUAGE sql
AS $$
  SELECT id, name, description, raw_json, (embedding <-> q_embedding) as distance
  FROM universities
  ORDER BY embedding <-> q_embedding
  LIMIT limit;
$$;
