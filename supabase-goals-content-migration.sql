-- Goals/Content/Task-notes migration (APPROVAL REQUIRED - NOT APPLIED)
-- Run AFTER supabase-migration.sql + supabase-agents-migration.sql.
-- achieved_at + content curation statuses used by /api/goals, /api/content, /api/tasks/:id/note.

ALTER TABLE goals ADD COLUMN IF NOT EXISTS achieved_at TIMESTAMPTZ;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_value NUMERIC DEFAULT 0;

-- content_queue generated/selected/discarded flow (status kept free-text; ensure cols)
ALTER TABLE content_queue ADD COLUMN IF NOT EXISTS curation_state TEXT DEFAULT 'new_daily';

CREATE INDEX IF NOT EXISTS goals_shop_status_idx ON goals (shop_id, status);
CREATE INDEX IF NOT EXISTS content_shop_status_idx ON content_queue (shop_id, status);
CREATE INDEX IF NOT EXISTS tasks_shop_idx ON tasks (shop_id);

NOTIFY pgrst, 'reload schema';
