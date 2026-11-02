-- Agents migration (APPROVAL REQUIRED - NOT APPLIED)
-- Run AFTER supabase-migration.sql + supabase-rag-migration.sql.
-- Adds passed_to_main + status values used by supervisorAgent/contentGenerator/learningAgent.

ALTER TABLE ai_insights ADD COLUMN IF NOT EXISTS passed_to_main BOOLEAN DEFAULT false;
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS curation_state TEXT DEFAULT 'new_daily';

-- widen content_queue.status beyond draft (generated/selected/discarded flow)
DO $$
BEGIN
  ALTER TABLE content_queue DROP CONSTRAINT IF EXISTS content_queue_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS ai_insights_shop_idx ON ai_insights (shop_id);
CREATE INDEX IF NOT EXISTS ai_insights_passed_idx ON ai_insights (passed_to_main) WHERE passed_to_main = true;

NOTIFY pgrst, 'reload schema';
