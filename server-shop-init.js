/**
 * Minimal Anna OS shop-init backend (Express + Supabase self-hosted).
 * POST /api/shop/init -> picks template via Llama 3.1 70B (Groq), creates shop,
 * shop_navs (is_approved=false) and users_roles. Never touches schema.
 *
 * Env (server-side only, never VITE_*):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AI_API_KEY (or GROQ_API_KEY), AI_MODEL, PORT
 * Frontend uses import.meta.env.VITE_SUPABASE_URL only (src/lib/supabase.ts).
 */
import express from 'express';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ragService } from './server-rag-service.js';
import { runAnalyze, runLearningCycle } from './server-agents.js';
import { mountGoalsContentTasks } from './server-goals-content.js';
import { mountPosRatingMessaging } from './server-pos-messaging.js';
import { checkSubscription, mountPayments } from './server-payments.js';
import { mountFrontendAPIs } from './server-frontend.js';
import { aiJSON } from './server-ai.js';

const here = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function loadTemplate(key) {
  try {
    const p = join(here, 'src', 'data', `template-${key}.json`);
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch { return null; }
}

// Meta Musepark 1.3 (server-ai.js): pick template key from onboarding answers, validated.
async function pickTemplate(answers) {
  const text = typeof answers === 'string' ? answers : JSON.stringify(answers);
  const parsed = await aiJSON(
    'Pick ONE template key for this retail shop. Return ONLY JSON: {"template_key":"electronics"|"supermarket"|"general-retail","shop_name":"string"}. Electronics/phones/repairs->electronics. Grocery/food->supermarket. Else general-retail.',
    text,
    {}
  );
  if (parsed && ['electronics', 'supermarket', 'general-retail'].includes(parsed.template_key)) return parsed;
  const lower = String(text).toLowerCase();
  if (lower.includes('electronic') || lower.includes('phone') || lower.includes('repair') || lower.includes('tv')) return { template_key: 'electronics' };
  if (lower.includes('supermarket') || lower.includes('grocery') || lower.includes('food')) return { template_key: 'supermarket' };
  return { template_key: 'general-retail' };
}

async function sb(path, method = 'GET', body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`supabase ${method} ${path}: ${r.status} ${await r.text()}`);
  return r.json();
}

app.post('/api/shop/init', async (req, res) => {
  try {
    const { answers = {}, owner_id = null, shop_name = null, currency = 'KES' } = req.body || {};
    const picked = await pickTemplate(answers);
    const template = loadTemplate(picked.template_key) || loadTemplate('general-retail');
    const name = shop_name || picked.shop_name || 'My Shop';

    const [shop] = await sb('shops', 'POST', {
      owner_id, name, type: template.shop_type || picked.template_key, currency,
      template_title: template.name,
    });

    // auto free subscription on shop creation
    await sb('subscriptions', 'POST', { shop_id: shop.id, plan: 'free', status: 'active' }).catch(() => []);

    // Scoped RLS context for downstream requests using this shop
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_shop_context`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: shop.id }),
    }).catch(() => {});

    const navRows = (template.navs || []).map((n, i) => ({
      shop_id: shop.id, label: n.label, path: n.path, icon: n.icon || 'store',
      is_fixed: !!n.is_fixed, is_approved: false, order_idx: i,
    }));
    const navs = navRows.length ? await sb('shop_navs', 'POST', navRows) : [];

    const roleRows = (template.roles || []).map((r) => ({
      shop_id: shop.id, user_id: owner_id, role_name: r, permissions: {},
    }));
    const roles = roleRows.length ? await sb('users_roles', 'POST', roleRows) : [];

    res.json({ shop, template_key: picked.template_key, navs, roles });
  } catch (e) {
    res.status(500).json({ error: String(e && e.message || e) });
  }
});

app.post('/api/rag/query', async (req, res) => {
  try {
    const { shop_id = null, question = '' } = req.body || {};
    if (!shop_id || !question) return res.status(400).json({ error: 'shop_id and question required' });
    const { context, answer, docs } = await ragService.answerQuery(shop_id, question);
    res.json({ context, answer, docs });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

// Index any write (sale / customer / note / task user_notes / goal / onboarding answer)
app.post('/api/rag/index', async (req, res) => {
  try {
    const { shop_id = null, kind = 'note', row = {} } = req.body || {};
    if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
    const saved = await ragService.indexWrite(shop_id, kind, row);
    res.json({ saved });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

// Multi-agent supervisor: POST /api/analyze/run { shop_id, briefOnly? } -> Daily Brief (plan-gated)
// briefOnly=true: cheap mode — supervisor brief only, no 4 insight logs, no content gen.
app.post('/api/analyze/run', checkSubscription, async (req, res) => {
  try {
    const { shop_id = null, briefOnly = false } = req.body || {};
    if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
    const result = await runAnalyze(shop_id, { briefOnly: Boolean(briefOnly) });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

// Agent observability: GET /api/agents/status -> model, key presence, env knobs.
app.get('/api/agents/status', (_req, res) => res.json({
  ok: true,
  model: process.env.AI_MODEL || 'meta-musepark-1.3',
  key_present: Boolean(process.env.AI_API_KEY || process.env.GROQ_API_KEY),
  base_url: process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions',
  timeout_ms: Number(process.env.AI_TIMEOUT_MS || 25000),
  max_retries: Number(process.env.AI_MAX_RETRIES || 2),
}));

// learningAgent cron 6h: POST /api/learn/run { shop_id? } (empty = all shops)
app.post('/api/learn/run', async (req, res) => {
  try {
    const { shop_id = null } = req.body || {};
    const result = await runLearningCycle(shop_id);
    res.json({ result });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

mountGoalsContentTasks(app);
mountPosRatingMessaging(app);
mountPayments(app);
mountFrontendAPIs(app);

const port = Number(process.env.PORT || 8080);
app.listen(port, () => console.log(`shop-init listening on :${port}`));
