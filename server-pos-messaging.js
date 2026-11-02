/**
 * POS + Customer rating + Messaging (wa.me fallback) + connectors CRUD.
 * Mounted by server-shop-init.js.
 *
 * ratingService.calculate(shop_id):
 *   per-customer ranks over (total_spent, visit_count, recency) averaged -> mapped 1-10.
 * POS sale: deduct stock, create sale, update customer, recalc rating,
 *   knowledge_base embedding, trigger salesAnalyzer insight.
 */
import { ragService } from './server-rag-service.js';
import { salesAnalyzer } from './server-agents.js';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SB_URL = () => process.env.SUPABASE_URL || '';
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

// --- ratingService: rating = (spend_rank + visit_rank + recency_rank)/3 mapped 1-10 ---
function rankFrac(values, v, higherIsBetter = true) {
  if (!values.length) return 0.5;
  const sorted = [...values].sort((a, b) => (higherIsBetter ? a - b : b - a));
  const idx = sorted.findIndex((x) => (higherIsBetter ? x >= v : x <= v));
  return (idx < 0 ? sorted.length - 1 : idx) / Math.max(sorted.length - 1, 1);
}

export const ratingService = {
  calculate(customers) {
    const list = customers || [];
    const spends = list.map((c) => Number(c.total_spent || 0));
    const visits = list.map((c) => Number(c.visit_count || 0));
    const recs = list.map((c) => (c.last_purchase_date ? Date.parse(c.last_purchase_date) : 0));
    return list.map((c) => {
      const spendR = rankFrac(spends, Number(c.total_spent || 0), true);
      const visitR = rankFrac(visits, Number(c.visit_count || 0), true);
      const recR = rankFrac(recs, c.last_purchase_date ? Date.parse(c.last_purchase_date) : 0, true);
      const rating = Math.min(10, Math.max(1, Math.round(((spendR + visitR + recR) / 3) * 9 + 1)));
      return { id: c.id, rating };
    });
  },
  async recalculate(shop_id) {
    const customers = await sb('customers', 'GET', null, `?shop_id=eq.${shop_id}&limit=1000`).catch(() => []);
    const ratings = ratingService.calculate(customers);
    const out = [];
    for (const { id, rating } of ratings) {
      const [u] = await sb('customers', 'PATCH', { rating }, `?id=eq.${id}`).catch(() => [null]);
      out.push(u || { id, rating });
    }
    return out;
  },
};

// --- credentials "encryption" (AES-256-GCM, app-side; set CREDENTIALS_KEY 32+ chars) ---
const CRED_KEY = () => (process.env.CREDENTIALS_KEY || 'dev-only-credentials-key-change-me').slice(0, 32).padEnd(32, '0');
export function encCreds(obj) {
  const key = scryptSync(CRED_KEY(), 'dukaai-salt', 32);
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(obj || {}), 'utf8'), c.final()]);
  return { iv: iv.toString('hex'), tag: c.getAuthTag().toString('hex'), data: enc.toString('hex') };
}
export function decCreds(wrapped) {
  try {
    if (!wrapped || !wrapped.data) return wrapped || {};
    const key = scryptSync(CRED_KEY(), 'dukaai-salt', 32);
    const d = createDecipheriv('aes-256-gcm', key, Buffer.from(wrapped.iv, 'hex'));
    d.setAuthTag(Buffer.from(wrapped.tag, 'hex'));
    return JSON.parse(Buffer.concat([d.update(Buffer.from(wrapped.data, 'hex')), d.final()]).toString('utf8'));
  } catch {
    return {};
  }
}

const waMe = (phone, text) => `https://wa.me/${String(phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text || '')}`;

export function mountPosRatingMessaging(app) {
  // POST /api/customers/recalculate-ratings {shop_id}
  app.post('/api/customers/recalculate-ratings', async (req, res) => {
    try {
      const { shop_id = null } = req.body || {};
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const updated = await ratingService.recalculate(shop_id);
      res.json({ updated: updated.length, customers: updated });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // GET /api/customers/:id?shop_id= — detail + rating + points + revenue history
  app.get('/api/customers/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const [c] = await sb('customers', 'GET', null, `?id=eq.${id}&limit=1`).catch(() => [null]);
      if (!c) return res.status(404).json({ error: 'customer not found' });
      const sales = await sb('sales', 'GET', null, `?customer_id=eq.${id}&order=date.desc&limit=100`).catch(() => []);
      const revenue = sales.reduce((s, r) => s + Number(r.total || 0), 0);
      res.json({ customer: c, rating: c.rating ?? null, points: c.points || 0, revenue, history: sales });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // POST /api/pos/sale {shop_id, product_id, customer_phone?, customer_id?, qty}
  app.post('/api/pos/sale', async (req, res) => {
    try {
      const { shop_id = null, product_id = null, customer_phone = '', customer_id = null, qty = 1, payment_method = 'cash' } = req.body || {};
      if (!shop_id || !product_id) return res.status(400).json({ error: 'shop_id and product_id required' });
      const n = Math.max(1, Number(qty) || 1);

      const [product] = await sb('products', 'GET', null, `?id=eq.${product_id}&limit=1`).catch(() => [null]);
      if (!product) return res.status(404).json({ error: 'product not found' });
      if (Number(product.stock_qty || 0) < n) return res.status(400).json({ error: 'insufficient stock' });

      const total = Number(product.sell_price || 0) * n;
      const receipt_no = `R-${Date.now().toString(36).toUpperCase()}`;

      // find or create customer by phone
      let customer = null;
      if (customer_id) {
        [customer] = await sb('customers', 'GET', null, `?id=eq.${customer_id}&limit=1`).catch(() => [null]);
      } else if (customer_phone) {
        const found = await sb('customers', 'GET', null, `?shop_id=eq.${shop_id}&phone=eq.${encodeURIComponent(customer_phone)}&limit=1`).catch(() => []);
        customer = found[0] || null;
        if (!customer) {
          [customer] = await sb('customers', 'POST', {
            shop_id, name: customer_phone, phone: customer_phone,
            total_spent: 0, visit_count: 0, points: 0,
          }).catch(() => [null]);
        }
      }

      // deduct stock + create sale
      const [updProduct] = await sb('products', 'PATCH', { stock_qty: Number(product.stock_qty) - n }, `?id=eq.${product_id}`);
      const [sale] = await sb('sales', 'POST', {
        shop_id, product_id, customer_id: customer?.id || null,
        qty: n, total, payment_method, receipt_no,
      });

      // update customer aggregates + points (1 pt per 100 KES)
      if (customer) {
        const pts = Math.floor(total / 100);
        await sb('customers', 'PATCH', {
          total_spent: Number(customer.total_spent || 0) + total,
          visit_count: Number(customer.visit_count || 0) + 1,
          last_purchase_date: new Date().toISOString().slice(0, 10),
          points: Number(customer.points || 0) + pts,
        }, `?id=eq.${customer.id}`).catch(() => []);
        // trigger rating recalc (best-effort, async)
        ratingService.recalculate(shop_id).catch(() => {});
      }

      // knowledge_base embedding (best-effort)
      try {
        await ragService.indexWrite(shop_id, 'sale', {
          qty: n, product_name: product.name, product_id, total, payment_method,
          customer_name: customer?.name || customer_phone || '', receipt_no,
        }, 'sale');
      } catch { /* never fail sale on indexing */ }

      // trigger salesAnalyzer insight (best-effort, async)
      salesAnalyzer({ sales: await sb('sales', 'GET', null, `?shop_id=eq.${shop_id}&order=date.desc&limit=200`).catch(() => []), products: [] })
        .then((out) => sb('ai_insights', 'POST', { shop_id, type: 'sales_analysis', title: 'Post-sale analysis', description: JSON.stringify(out).slice(0, 4000), status: 'active' }).catch(() => {}))
        .catch(() => {});

      res.json({ sale, product: updProduct || product, receipt_no });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // GET /api/sales/history?shop_id=&date_from=&date_to=&customer_id=&rating=&product_id=&page=&pageSize=
  app.get('/api/sales/history', async (req, res) => {
    try {
      const { shop_id = '', date_from = '', date_to = '', customer_id = '', product_id = '', rating = '', page = '1', pageSize = '20' } = req.query;
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const pg = Math.max(1, Number(page) || 1);
      const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
      let q = `?shop_id=eq.${shop_id}&order=date.desc&limit=${ps}&offset=${(pg - 1) * ps}`;
      if (date_from) q += `&date=gte.${date_from}`;
      if (date_to) q += `&date=lte.${date_to}`;
      if (customer_id) q += `&customer_id=eq.${customer_id}`;
      if (product_id) q += `&product_id=eq.${product_id}`;
      let sales = await sb('sales', 'GET', null, q).catch(() => []);
      if (rating) {
        const r = Number(rating);
        const custIds = new Set(
          (await sb('customers', 'GET', null, `?shop_id=eq.${shop_id}&rating=eq.${r}&limit=1000`).catch(() => [])).map((c) => c.id)
        );
        sales = sales.filter((s) => custIds.has(s.customer_id));
      }
      res.json({ sales, page: pg, pageSize: ps });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // ---- connectors CRUD (settings) ----
  app.get('/api/connectors', async (req, res) => {
    try {
      const shop_id = req.query.shop_id;
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const rows = await sb('connectors', 'GET', null, `?shop_id=eq.${shop_id}&limit=50`);
      res.json({ connectors: rows.map((c) => ({ ...c, credentials: undefined })) });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  app.post('/api/connectors', async (req, res) => {
    try {
      const { shop_id = null, type = 'whatsapp_api', credentials = {}, is_connected = false } = req.body || {};
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      if (!['gmail', 'whatsapp_api', 'sms_africas_talking'].includes(type)) {
        return res.status(400).json({ error: 'type must be gmail|whatsapp_api|sms_africas_talking' });
      }
      const [row] = await sb('connectors', 'POST', {
        shop_id, type, connector_id: type, status: is_connected ? 'connected' : 'disconnected',
        credentials: encCreds(credentials), config: {}, is_connected,
      });
      res.json({ connector: { ...row, credentials: undefined } });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  app.patch('/api/connectors/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const patch = {};
      if (req.body.type) patch.type = req.body.type;
      if (req.body.connector_id) patch.connector_id = req.body.connector_id;
      if (req.body.credentials) patch.credentials = encCreds(req.body.credentials);
      if (typeof req.body.is_connected === 'boolean') {
        patch.is_connected = req.body.is_connected;
        patch.status = req.body.is_connected ? 'connected' : 'disconnected';
      }
      if (req.body.status) patch.status = req.body.status;
      const [row] = await sb('connectors', 'PATCH', patch, `?id=eq.${id}`);
      res.json({ connector: row ? { ...row, credentials: undefined } : null });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  app.delete('/api/connectors/:id', async (req, res) => {
    try {
      await sb(`connectors?id=eq.${req.params.id}`, 'DELETE');
      res.json({ deleted: req.params.id });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // POST /api/messaging/send {shop_id, task_id?, customer_ids[], content, channel}
  // whatsapp_api connected -> WhatsApp Cloud API (mock axios); else wa.me links.
  app.post('/api/messaging/send', async (req, res) => {
    try {
      const { shop_id = null, task_id = null, customer_ids = [], content = '', channel = 'whatsapp' } = req.body || {};
      if (!shop_id || !content) return res.status(400).json({ error: 'shop_id and content required' });
      const conns = await sb('connectors', 'GET', null, `?shop_id=eq.${shop_id}&limit=20`).catch(() => []);
      const wa = conns.find((c) => (c.type || c.connector_id) === 'whatsapp_api' && (c.is_connected || c.status === 'connected'));

      const customers = [];
      for (const cid of customer_ids || []) {
        const [c] = await sb('customers', 'GET', null, `?id=eq.${cid}&limit=1`).catch(() => [null]);
        if (c) customers.push(c);
      }

      const results = [];
      for (const c of customers) {
        let status = 'pending';
        let link = waMe(c.phone, content);
        if (wa && channel === 'whatsapp') {
          // WhatsApp Cloud API send (mock axios — real call when creds present)
          const creds = decCreds(wa.credentials && wa.credentials.data ? wa.credentials : null);
          try {
            if (creds.phone_number_id && creds.token) {
              const r = await fetch(`https://graph.facebook.com/v21.0/${creds.phone_number_id}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messaging_product: 'whatsapp', to: String(c.phone || '').replace(/[^0-9]/g, ''), type: 'text', text: { body: content } }),
              });
              status = r.ok ? 'sent' : 'failed';
              if (!r.ok) link = waMe(c.phone, content);
            } else {
              status = 'mock_sent'; // connected but no live creds — logged as sent for learning
            }
          } catch {
            status = 'failed';
            link = waMe(c.phone, content);
          }
        } else {
          status = 'wa_me_link'; // fallback: return wa.me link for manual send
        }
        const [log] = await sb('message_logs', 'POST', {
          shop_id, recipient_phone: c.phone || '', template_type: channel,
          message_body: `${task_id ? `[task ${task_id}] ` : ''}${content}`.slice(0, 2000), status,
        }).catch(() => [null]);
        // store actual content in a second pass (keeps schema-flex)
        results.push({ customer_id: c.id, phone: c.phone, status, link, log_id: log?.id || null });
      }
      res.json({ channel, whatsapp_connected: Boolean(wa), results });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // PATCH /api/message-log/:id/status {status} — mark sent; learningAgent reads all
  app.patch('/api/message-log/:id/status', async (req, res) => {
    try {
      const { status = 'sent' } = req.body || {};
      const [log] = await sb('message_logs', 'PATCH', { status }, `?id=eq.${req.params.id}`);
      res.json({ log });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });
}
