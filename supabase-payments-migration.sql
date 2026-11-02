-- Payments/subscriptions migration (APPROVAL REQUIRED - NOT APPLIED)
-- Run AFTER supabase-migration.sql.
-- payments: reference/status/channel/plan for Paystack; subscriptions: plan/status/expires_at.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'paystack';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'KES';

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE subscriptions ALTER COLUMN plan SET DEFAULT 'free';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE subscriptions ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_uidx ON payments (reference) WHERE reference IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_shop_idx ON payments (shop_id);
CREATE INDEX IF NOT EXISTS subscriptions_shop_idx ON subscriptions (shop_id);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_shop_uidx ON subscriptions (shop_id);

NOTIFY pgrst, 'reload schema';
