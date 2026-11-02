/**
 * Paystack payments + subscriptions + checkSubscription middleware.
 * Mounted by server-shop-init.js.
 *
 * Plans (limits): free 1 shop/50 products/100 customers/20 sales/5 analysis-mo;
 * starter $19/KES2500 300/1000/5000/100; growth $49/KES6500 unlimited products/customers,
 * 10 roles, all connectors; scale $99/KES13000 multi-shop unlimited.
 * Env: PAYSTACK_SECRET_KEY (test keys), PAYSTACK_CALLBACK_URL (frontend return url).
 */
import { createHmac } from 'crypto';
import PRICING from './src/data/pricing-plans.json' with { type: 'json' };

const SB_URL = () => process.env.SUPABASE_URL || '';
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const PAYSTACK_KEY = () => process.env.PAYSTACK_SECRET_KEY || '';

export const PLANS = Object.fromEntries(PRICING.plans.map((p) => [p.key, p]));

async function sb(path, method = 'GET', body, query = '') {
  const r = await fetch(`${SB_URL()}/rest/v1/${path}${query}`, {
    method,
    headers: {
      apikey: SB_KEY(),
      Authorization: `Bearer ${SB_KEY()}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`supabase ${method} ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function paystack(path, method = 'GET', body) {
  const r = await fetch(`https://api.paystack.co/${path}`, {
    method,
    headers: { Authorization: `Bearer ${PAYSTACK_KEY()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status === false) throw new Error(`paystack ${path}: ${j.message || r.status}`);
  return j.data;
}

export async function getSubscription(shop_id) {
  const rows = await sb('subscriptions', 'GET', null, `?shop_id=eq.${shop_id}&limit=1`).catch(() => []);
  if (rows[0]) return rows[0];
  // auto free on first read (shop creation also seeds it)
  const [fresh] = await sb('subscriptions', 'POST', { shop_id, plan: 'free', status: 'active' }).catch(() => [null]);
  return fresh || { shop_id, plan: 'free', status: 'active' };
}

export async function getUsage(shop_id, owner_id) {
  const [products, customers, sales, insights, shops] = await Promise.all([
    sb('products', 'GET', null, `?shop_id=eq.${shop_id}&select=id&limit=1`, '').catch(() => []),
    sb('customers', 'GET', null, `?shop_id=eq.${shop_id}&select=id&limit=1`).catch(() => []),
    sb('sales', 'GET', null, `?shop_id=eq.${shop_id}&select=id&limit=1`).catch(() => []),
    sb('ai_insights', 'GET', null, `?shop_id=eq.${shop_id}&type=eq.daily_brief&select=id&limit=1000`).catch(() => []),
    owner_id ? sb('shops', 'GET', null, `?owner_id=eq.${owner_id}&select=id&limit=100`).catch(() => []) : [],
  ]);
  // counts via Prefer: count=exact would need headers; use length of capped fetch for small caps,
  // and a cheap exact-count RPC fallback: use PostgREST ?select with head. Simplify: fetch ids capped at limit+1.
  async function count(table, extra = '') {
    const rows = await sb(table, 'GET', null, `?shop_id=eq.${shop_id}&select=id${extra}&limit=2000`).catch(() => []);
    return rows.length;
  }
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const analysisThisMonth = (insights || []).filter((i) => Date.parse(i.created_at || 0) >= monthStart.getTime()).length;
  void products; void customers; void sales;
  const [nProducts, nCustomers, nSales] = await Promise.all([
    count('products'), count('customers'), count('sales'),
  ]);
  return {
    products: nProducts, customers: nCustomers, sales: nSales,
    analysis_this_month: analysisThisMonth,
    shops_owned: (shops || []).length,
  };
}

// checkSubscription gate for /api/analyze/run + /api/content/generate (and POST /api/pos/sale caps).
export async function checkSubscription(req, res, next) {
  try {
    const shop_id = req.body?.shop_id || req.query?.shop_id;
    if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
    const sub = await getSubscription(shop_id);
    const plan = PLANS[sub.plan] || PLANS.free;
    const [shop] = await sb('shops', 'GET', null, `?id=eq.${shop_id}&select=id,owner_id&limit=1`).catch(() => [null]);
    const usage = await getUsage(shop_id, shop?.owner_id);
    const L = plan.limits;
    const over =
      (L.products >= 0 && usage.products >= L.products) ||
      (L.customers >= 0 && usage.customers >= L.customers) ||
      (L.sales >= 0 && usage.sales >= L.sales) ||
      (L.analysis_per_month >= 0 && usage.analysis_this_month >= L.analysis_per_month && req.path.includes('/analyze/'));
    if (over || sub.status !== 'active') {
      return res.status(403).json({
        error: 'plan_limit_exceeded',
        plan: plan.key,
        usage,
        limits: L,
        upgrade: 'Upgrade to Starter/Growth/Scale to continue.',
      });
    }
    req.subscription = sub;
    req.usage = usage;
    next();
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}

export function mountPayments(app) {
  // POST /api/payments/initialize {shop_id, plan, email, currency?}
  app.post('/api/payments/initialize', async (req, res) => {
    try {
      const { shop_id = null, plan = 'starter', email = '', currency = 'KES', callback_url = '' } = req.body || {};
      if (!shop_id || !email) return res.status(400).json({ error: 'shop_id and email required' });
      if (!PLANS[plan] || plan === 'free') return res.status(400).json({ error: 'plan must be starter|growth|scale' });
      const amountMinor = Math.round(Number(PLANS[plan][currency === 'KES' ? 'kes' : 'usd']) * 100);
      const reference = `duka_${shop_id.slice(0, 8)}_${Date.now().toString(36)}`;
      let authUrl = '';
      let accessCode = '';
      try {
        const tx = await paystack('transaction/initialize', 'POST', {
          email, amount: amountMinor, currency: currency === 'KES' ? 'KES' : 'USD',
          reference, callback_url: callback_url || process.env.PAYSTACK_CALLBACK_URL || '',
          metadata: { shop_id, plan },
        });
        authUrl = tx.authorization_url || '';
        accessCode = tx.access_code || '';
      } catch (e) {
        // test mode without live key: still save pending payment with mock url
        authUrl = `https://paystack.test/pay/${reference}`;
        void e;
      }
      const [payment] = await sb('payments', 'POST', {
        shop_id, amount: amountMinor / 100, currency, method: 'paystack',
        receipt_no: reference, reference, status: 'pending', channel: 'paystack', plan,
      });
      res.json({ payment, authorization_url: authUrl, access_code: accessCode, reference });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // POST /api/payments/webhook — verifies Paystack signature, flips pending->success, upserts subscription
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const raw = JSON.stringify(req.body || {});
      const sig = req.headers['x-paystack-signature'] || '';
      const expected = createHmac('sha512', PAYSTACK_KEY()).update(raw).digest('hex');
      if (PAYSTACK_KEY() && sig !== expected) return res.status(401).json({ error: 'invalid signature' });
      const event = (req.body || {}).event || '';
      const data = (req.body || {}).data || {};
      if (event === 'charge.success') {
        const ref = data.reference || '';
        const rows = await sb('payments', 'GET', null, `?reference=eq.${ref}&limit=1`).catch(() => []);
        const pay = rows[0];
        if (pay && pay.status !== 'success') {
          await sb('payments', 'PATCH', { status: 'success' }, `?id=eq.${pay.id}`).catch(() => []);
          const plan = pay.plan || data?.metadata?.plan || 'starter';
          const months = 1;
          const expires = new Date();
          expires.setMonth(expires.getMonth() + months);
          const existing = await sb('subscriptions', 'GET', null, `?shop_id=eq.${pay.shop_id}&limit=1`).catch(() => []);
          if (existing[0]) {
            await sb('subscriptions', 'PATCH', { plan, status: 'active', expires_at: expires.toISOString(), current_period_end: expires.toISOString() }, `?id=eq.${existing[0].id}`).catch(() => []);
          } else {
            await sb('subscriptions', 'POST', { shop_id: pay.shop_id, plan, status: 'active', expires_at: expires.toISOString(), current_period_end: expires.toISOString() }).catch(() => []);
          }
        }
      }
      res.json({ received: true });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // GET /api/subscription/:shop_id — plan + usage + limits
  app.get('/api/subscription/:shop_id', async (req, res) => {
    try {
      const shop_id = req.params.shop_id;
      const sub = await getSubscription(shop_id);
      const plan = PLANS[sub.plan] || PLANS.free;
      const [shop] = await sb('shops', 'GET', null, `?id=eq.${shop_id}&select=id,owner_id&limit=1`).catch(() => [null]);
      const usage = await getUsage(shop_id, shop?.owner_id);
      res.json({ subscription: sub, plan: { key: plan.key, name: plan.name, usd: plan.usd, kes: plan.kes }, limits: plan.limits, usage, plans: PRICING.plans });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });
}
