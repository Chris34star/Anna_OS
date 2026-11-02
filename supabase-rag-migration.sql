-- RAG migration (APPROVAL REQUIRED - NOT APPLIED)
-- Run in Supabase self-hosted SQL editor AFTER supabase-migration.sql.
-- Enables pgvector, vector index, match_knowledge_base RPC used by ragService.search.

CREATE EXTENSION IF NOT EXISTS vector;

-- match_knowledge_base(p_shop_id uuid, p_embedding vector(384), p_limit int)
-- Returns top docs with cosine similarity (1 - distance) for hybrid scoring.
CREATE OR REPLACE FUNCTION match_knowledge_base(p_shop_id uuid, p_embedding vector(384), p_limit int DEFAULT 10)
RETURNS TABLE (id uuid, shop_id uuid, content text, source_type text, similarity float, created_at timestamptz)
LANGUAGE sql STABLE AS $$
  SELECT kb.id, kb.shop_id, kb.content, kb.source_type,
         1 - (kb.embedding <=> p_embedding) AS similarity,
         kb.created_at
  FROM knowledge_base kb
  WHERE kb.shop_id = p_shop_id AND kb.embedding IS NOT NULL
  ORDER BY kb.embedding <=> p_embedding
  LIMIT p_limit;
$$;

-- keyword trigram support for the 30% keyword leg (optional but cheap)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS knowledge_base_content_trgm ON knowledge_base USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS knowledge_base_shop_idx ON knowledge_base (shop_id);

NOTIFY pgrst, 'reload schema';
