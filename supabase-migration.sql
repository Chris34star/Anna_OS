-- Anna OS backend foundation (APPROVAL REQUIRED - NOT APPLIED)
-- Run in Supabase self-hosted SQL editor. Never applied by agent.
-- Enables pgvector, creates all tables, seeds templates, sets shop_id RLS.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- shops
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general-retail',
  currency TEXT NOT NULL DEFAULT 'KES',
  staff_count INT DEFAULT 4,
  template_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- shop_navs ("order" avoided as reserved; order_idx maps to spec order)
CREATE TABLE IF NOT EXISTS shop_navs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT DEFAULT 'store',
  is_fixed BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  order_idx INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  navs JSONB NOT NULL DEFAULT '[]',
  roles JSONB NOT NULL DEFAULT '[]',
  custom_fields JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS users_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID,
  role_name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT DEFAULT '',
  category TEXT DEFAULT '',
  buy_price NUMERIC DEFAULT 0,
  sell_price NUMERIC DEFAULT 0,
  stock_qty INT DEFAULT 0,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  total_spent NUMERIC DEFAULT 0,
  visit_count INT DEFAULT 0,
  last_purchase_date DATE,
  points INT DEFAULT 0,
  rating INT CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10)),
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  qty INT DEFAULT 1,
  total NUMERIC DEFAULT 0,
  date TIMESTAMPTZ DEFAULT now(),
  payment_method TEXT DEFAULT 'cash',
  receipt_no TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'general',
  assigned_role TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  user_notes TEXT DEFAULT '',
  ai_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','achieved','archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'whatsapp_status',
  title TEXT DEFAULT '',
  hook TEXT DEFAULT '',
  script_body TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  recipient_phone TEXT DEFAULT '',
  template_type TEXT DEFAULT '',
  message_body TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source_type TEXT DEFAULT 'manual',
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'sales_strategy',
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT DEFAULT 'disconnected',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  amount NUMERIC DEFAULT 0,
  method TEXT DEFAULT 'mpesa',
  receipt_no TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS active_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  percent INT DEFAULT 0,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- vector similarity indexes
CREATE INDEX IF NOT EXISTS products_embedding_idx ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS customers_embedding_idx ON customers USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS shop_navs_shop_idx ON shop_navs (shop_id);
CREATE INDEX IF NOT EXISTS products_shop_idx ON products (shop_id);

-- seed templates (navs / roles / custom_fields)
INSERT INTO shop_templates (key, name, navs, roles, custom_fields) VALUES
('electronics','Electronics & Repairs',
 '[{"label":"Analyzer","path":"analyzer","icon":"chart","is_fixed":true},{"label":"POS","path":"pos","icon":"cart","is_fixed":true},{"label":"Inventory","path":"inventory","icon":"box","is_fixed":false},{"label":"Repairs","path":"tasks","icon":"wrench","is_fixed":false},{"label":"Customers","path":"customers","icon":"users","is_fixed":false},{"label":"Chat","path":"chat","icon":"chat","is_fixed":false}]',
 '["CEO","Cashier","Technician","Stock Manager"]',
 '["warranty_months","serial_no","condition","supplier"]'),
('supermarket','Supermarket & Grocery',
 '[{"label":"Analyzer","path":"analyzer","icon":"chart","is_fixed":true},{"label":"POS","path":"pos","icon":"cart","is_fixed":true},{"label":"Inventory","path":"inventory","icon":"box","is_fixed":false},{"label":"Customers","path":"customers","icon":"users","is_fixed":false},{"label":"Goals","path":"goals","icon":"target","is_fixed":false},{"label":"Chat","path":"chat","icon":"chat","is_fixed":false}]',
 '["CEO","Cashier","Inventory Clerk","Floor Manager"]',
 '["expiry_date","batch_no","supplier"]'),
('general-retail','General Retail / Boutique',
 '[{"label":"Analyzer","path":"analyzer","icon":"chart","is_fixed":true},{"label":"POS","path":"pos","icon":"cart","is_fixed":true},{"label":"Inventory","path":"inventory","icon":"box","is_fixed":false},{"label":"Customers","path":"customers","icon":"users","is_fixed":false},{"label":"Content","path":"content","icon":"sparkles","is_fixed":false},{"label":"Chat","path":"chat","icon":"chat","is_fixed":false}]',
 '["CEO","Floor Cashier","Stock Manager","Attendant"]',
 '["size","color","material","supplier"]')
ON CONFLICT (key) DO UPDATE SET navs=EXCLUDED.navs, roles=EXCLUDED.roles, custom_fields=EXCLUDED.custom_fields;

-- RLS: shop_id filtered via app.shop_id setting; service_role bypasses RLS by default.
-- App sets: SET LOCAL app.shop_id = '<shop_uuid>' per request (server-shop-init.js does this).
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['shops','shop_navs','users_roles','products','customers','sales','tasks','goals','content_queue','message_logs','knowledge_base','ai_insights','connectors','subscriptions','payments','active_discounts'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- permissive authenticated policy scoped to app.shop_id; tighten once auth.users wiring is done.
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['shop_navs','users_roles','products','customers','sales','tasks','goals','content_queue','message_logs','knowledge_base','ai_insights','connectors','subscriptions','payments','active_discounts'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS shop_isolation ON %I', t);
    EXECUTE format('CREATE POLICY shop_isolation ON %I FOR ALL TO authenticated USING (shop_id = nullif(current_setting(''app.shop_id'', true), '''')::uuid OR current_setting(''app.shop_id'', true) = '''') WITH CHECK (shop_id = nullif(current_setting(''app.shop_id'', true), '''')::uuid OR current_setting(''app.shop_id'', true) = '''')', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS shop_isolation ON shops;
CREATE POLICY shop_isolation ON shops FOR ALL TO authenticated
USING (id = nullif(current_setting('app.shop_id', true), '')::uuid OR current_setting('app.shop_id', true) = '')
WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
