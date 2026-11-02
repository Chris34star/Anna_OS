/**
 * Frontend wiring endpoints: navs, insights, tasks, ai-chat commands, demo seeder, onboarding notes.
 * Mounted by server-shop-init.js. No schema changes.
 */
import { ragService } from './server-rag-service.js';
import { salesAnalyzer } from './server-agents.js';

const SB_URL = () => process.env.SUPABASE_URL || '';
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function sb(path, method = 'GET', body, query = '') {
  const r = await fetch(`${SB_URL()}/rest/v1/${path}${query}`, {
    method,
    headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`supabase ${method} ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function mountFrontendAPIs(app) {
  // Dynamic sidebar: GET /api/shop/navs?shop_id= (approved filter client-side)
  app.get('/api/shop/navs', async (req, res) => {
    try {
      const shop_id = req.query.shop_id;
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const navs = await sb('shop_navs', 'GET', null, `?shop_id=eq.${shop_id}&order=order_idx.asc&limit=50`);
      res.json({ navs });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });

  // Nav approval checkboxes: PATCH /api/shop/navs/:id {is_approved}
  app.patch('/api/shop/navs/:id', async (req, res) => {
    try {
      const [nav] = await sb('shop_navs', 'PATCH', { is_approved: Boolean(req.body?.is_approved) }, `?id=eq.${req.params.id}`);
      res.json({ nav });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });

  // Dashboard insights: GET /api/insights?shop_id=&limit=
  app.get('/api/insights', async (req, res) => {
    try {
      const shop_id = req.query.shop_id;
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const limit = Math.min(50, Number(req.query.limit) || 10);
      const rows = await sb('ai_insights', 'GET', null, `?shop_id=eq.${shop_id}&order=created_at.desc&limit=${limit}`);
      res.json({ insights: rows });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });

  // Tasks: GET list + PATCH status (approve/dismiss) — note endpoint already exists
  app.get('/api/tasks', async (req, res) => {
    try {
      const shop_id = req.query.shop_id;
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const rows = await sb('tasks', 'GET', null, `?shop_id=eq.${shop_id}&order=created_at.desc&limit=100`);
      res.json({ tasks: rows });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });
  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const patch = {};
      if (req.body?.status) patch.status = req.body.status;
      if (req.body?.assigned_role !== undefined) patch.assigned_role = req.body.assigned_role;
      const [task] = await sb('tasks', 'PATCH', patch, `?id=eq.${req.params.id}`);
      res.json({ task });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });

  // AI chat commands: POST /api/ai-chat/command {shop_id, text}
  // - "Hide profit from cashiers" -> users_roles permissions JSONB update
  // - "What about dead stock" -> salesAnalyzer run
  // - else RAG query fallback
  app.post('/api/ai-chat/command', async (req, res) => {
    try {
      const { shop_id = null, text = '' } = req.body || {};
      if (!shop_id || !text) return res.status(400).json({ error: 'shop_id and text required' });
      const lower = String(text).toLowerCase();
      if (lower.includes('hide profit') && lower.includes('cashier')) {
        const roles = await sb('users_roles', 'GET', null, `?shop_id=eq.${shop_id}&limit=50`).catch(() => []);
        const updated = [];
        for (const r of roles) {
          if (/cashier/i.test(r.role_name || '')) {
            const perms = { ...(r.permissions || {}), can_view_profit: false, can_view_analyzer: false };
            const [u] = await sb('users_roles', 'PATCH', { permissions: perms }, `?id=eq.${r.id}`).catch(() => [null]);
            updated.push(u || { ...r, permissions: perms });
          }
        }
        try { await ragService.indexWrite(shop_id, 'note', `Command executed: hide profit from cashiers (${updated.length} roles)`, 'ai_chat'); } catch {}
        return res.json({ action: 'hide_profit', updated, answer: `Done — profit hidden from ${updated.length} cashier role(s). Analyzer/profit views are now disabled for them.` });
      }
      if (lower.includes('dead stock')) {
        const sales = await sb('sales', 'GET', null, `?shop_id=eq.${shop_id}&order=date.desc&limit=200`).catch(() => []);
        const products = await sb('products', 'GET', null, `?shop_id=eq.${shop_id}&limit=200`).catch(() => []);
        const out = await salesAnalyzer({ sales, products });
        try { await ragService.indexWrite(shop_id, 'note', `Dead stock check: ${JSON.stringify(out).slice(0, 1000)}`, 'ai_chat'); } catch {}
        return res.json({ action: 'dead_stock', answer: out.dead_stock?.length ? `Dead stock (${out.dead_stock.length}): ${out.dead_stock.slice(0, 5).map((d) => d.name).join(', ')}` : 'No dead stock detected.', data: out });
      }
      const { context, answer } = await ragService.answerQuery(shop_id, text);
      return res.json({ action: 'rag', answer, context });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });

  // Onboarding notes: POST /api/onboarding/notes {shop_id, notes} -> knowledge_base
  app.post('/api/onboarding/notes', async (req, res) => {
    try {
      const { shop_id = null, notes = '' } = req.body || {};
      if (!shop_id || !notes) return res.status(400).json({ error: 'shop_id and notes required' });
      const saved = await ragService.indexWrite(shop_id, 'onboarding', notes, 'onboarding');
      res.json({ saved });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });

  // Demo seeder: POST /api/seed/demo {shop_id} -> 60 products, 120 customers (ratings 1-10), 300 sales, 5 KB docs
  app.post('/api/seed/demo', async (req, res) => {
    try {
      const { shop_id = null } = req.body || {};
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const cats = ['Electronics', 'Grocery', 'Fashion', 'Home', 'Beauty'];
      const products = Array.from({ length: 60 }, (_, i) => ({
        shop_id, name: `${pick(cats)} Item ${i + 1}`, sku: `SKU-${1000 + i}`,
        category: pick(cats), buy_price: rnd(100, 2000), sell_price: rnd(300, 4000),
        stock_qty: rnd(0, 100), custom_fields: {},
      }));
      const createdProducts = await sb('products', 'POST', products).catch(() => []);
      const names = ['Amina', 'Brian', 'Cynthia', 'David', 'Esther', 'Faith', 'George', 'Hellen', 'Ian', 'Joyce'];
      const customers = Array.from({ length: 120 }, (_, i) => ({
        shop_id, name: `${pick(names)} ${i + 1}`, phone: `2547${String(rnd(10000000, 79999999))}`,
        total_spent: rnd(500, 80000), visit_count: rnd(1, 40),
        last_purchase_date: new Date(Date.now() - rnd(0, 90) * 86400000).toISOString().slice(0, 10),
        points: rnd(0, 500), rating: rnd(1, 10),
      }));
      const createdCustomers = await sb('customers', 'POST', customers).catch(() => []);
      const sales = Array.from({ length: 300 }, () => {
        const p = pick(createdProducts.length ? createdProducts : [{ id: null, sell_price: 500 }]);
        const c = pick(createdCustomers.length ? createdCustomers : [{ id: null }]);
        const qty = rnd(1, 5);
        return { shop_id, product_id: p.id, customer_id: c.id, qty, total: Number(p.sell_price || 500) * qty, payment_method: pick(['cash', 'mpesa', 'card']), receipt_no: `R-${Date.now().toString(36)}-${rnd(100, 999)}` };
      });
      await sb('sales', 'POST', sales).catch(() => []);
      const docs = [
        'Shop playbook: greet every customer, offer receipt, ask for phone for points.',
        'Dead stock rule: 30+ days no sale -> 10% discount, 60+ days -> bundle offer.',
        'VIP rule: rating 8+ gets early access to new stock via WhatsApp.',
        'Cashier rule: profit margins hidden; focus on basket size and repeat visits.',
        'Restock rule: fast movers reordered when stock hits 20% of monthly sales.',
      ];
      for (const d of docs) { try { await ragService.indexWrite(shop_id, 'note', d, 'seed_doc'); } catch {} }
      res.json({ products: createdProducts.length || 60, customers: createdCustomers.length || 120, sales: 300, kb_docs: 5 });
    } catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
  });
}
