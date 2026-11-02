-- POS/Rating/Messaging migration (APPROVAL REQUIRED - NOT APPLIED)
-- Run AFTER supabase-migration.sql.
-- Spec connectors shape: type + credentials JSONB (encrypted app-side) + is_connected.
-- Existing connectors(connector_id,status,config) is kept; this adds the spec columns
-- so old rows keep working and new CRUD uses type/credentials/is_connected.

ALTER TABLE connectors ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'whatsapp_api';
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS credentials JSONB NOT NULL DEFAULT '{}';
ALTER TABLE connectors ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT false;

-- backfill spec cols from legacy cols (one-time, idempotent)
UPDATE connectors SET type = COALESCE(NULLIF(connector_id,''), 'whatsapp_api')
WHERE type IS NULL OR type = '';
UPDATE connectors SET is_connected = (status = 'connected') WHERE is_connected IS NULL;
UPDATE connectors SET credentials = COALESCE(config, '{}') WHERE credentials = '{}' AND config IS NOT NULL;

CREATE INDEX IF NOT EXISTS connectors_shop_idx ON connectors (shop_id);
CREATE INDEX IF NOT EXISTS connectors_shop_type_idx ON connectors (shop_id, type);
CREATE INDEX IF NOT EXISTS sales_shop_date_idx ON sales (shop_id, date DESC);
CREATE INDEX IF NOT EXISTS customers_shop_rating_idx ON customers (shop_id, rating DESC);

NOTIFY pgrst, 'reload schema';
