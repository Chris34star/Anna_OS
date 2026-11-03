-- Approval SQL: run AFTER supabase-migration.sql (requires superuser / pf-apply.sh).
-- Everything else from the request already exists in the live schema (verified 2026-11-03).
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE OR REPLACE FUNCTION match_knowledge_base(p_shop_id uuid, p_embedding vector(384), p_limit int DEFAULT 10)
RETURNS TABLE (id uuid, shop_id uuid, content text, source_type text, similarity float, created_at timestamptz)
LANGUAGE sql STABLE AS $$
  SELECT kb.id, kb.shop_id, kb.content, kb.source_type,
         1 - (kb.embedding <=> p_embedding) AS similarity, kb.created_at
  FROM knowledge_base kb
  WHERE kb.shop_id = p_shop_id AND kb.embedding IS NOT NULL
  ORDER BY kb.embedding <=> p_embedding LIMIT p_limit;
$$;
CREATE INDEX IF NOT EXISTS knowledge_base_content_trgm ON knowledge_base USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
NOTIFY pgrst, 'reload schema';
