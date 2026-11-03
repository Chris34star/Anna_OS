/**
 * Shared AI client — all agents use Meta Musepark 1.3 (env AI_MODEL).
 * 10/10 hardening: timeout + retry + safe JSON parse + input truncation.
 * Env: AI_API_KEY (fallback GROQ_API_KEY), AI_MODEL, AI_BASE_URL,
 *      AI_TIMEOUT_MS (default 25000), AI_MAX_RETRIES (default 2).
 */
export const AI_MODEL = process.env.AI_MODEL || 'meta-musepark-1.3';
export const AI_API_KEY = process.env.AI_API_KEY || process.env.GROQ_API_KEY || '';
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 25000);
const AI_MAX_RETRIES = Number(process.env.AI_MAX_RETRIES || 2);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function truncateStr(v, max = 12000) {
  const s = typeof v === 'string' ? v : JSON.stringify(v ?? '');
  return s.length > max ? s.slice(0, max) : s;
}

/** Extract first {...} block (strips ``` fences) and JSON.parse it. */
export function safeParseJSON(text, fallback) {
  if (!text) return fallback;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  try {
    return JSON.parse(s);
  } catch { /* try block extraction */ }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(s.slice(start, end + 1));
    } catch { /* fall through */ }
  }
  return fallback;
}

async function postOnce(system, userStr, temperature) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const r = await fetch(AI_BASE_URL, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AI_API_KEY}` },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userStr },
        ],
      }),
    });
    if (!r.ok) {
      // No retry on 4xx (bad request/auth); retry only on 429/5xx.
      const retryable = r.status === 429 || r.status >= 500;
      return { ok: false, retryable };
    }
    const j = await r.json().catch(() => null);
    const content = j?.choices?.[0]?.message?.content || '';
    return { ok: true, content };
  } catch {
    return { ok: false, retryable: true };
  } finally {
    clearTimeout(t);
  }
}

/** Robust JSON tool call. Returns fallback when key missing or all retries fail. */
export async function aiJSON(system, user, fallback, opts = {}) {
  if (!AI_API_KEY) return fallback;
  const userStr = truncateStr(user, opts.maxChars || 12000);
  const temperature = opts.temperature ?? 0.2;
  for (let attempt = 0; attempt <= AI_MAX_RETRIES; attempt++) {
    const res = await postOnce(system, userStr, temperature);
    if (res.ok) {
      const parsed = safeParseJSON(res.content, null);
      if (parsed !== null && parsed !== undefined) return parsed;
      return fallback; // valid HTTP but unparseable — don't burn retries
    }
    if (!res.retryable) return fallback;
    if (attempt < AI_MAX_RETRIES) await sleep(400 * (attempt + 1));
  }
  return fallback;
}

/** Time any agent step: returns { v, ms }. Never throws. */
export async function timed(fn) {
  const t0 = Date.now();
  try {
    const v = await fn();
    return { v, ms: Date.now() - t0 };
  } catch {
    return { v: null, ms: Date.now() - t0 };
  }
}

/** Step0: deterministic ground truth (free, no LLM). Same logic as frontend llama.ts.
 *  Canonical source — imported by server-agents-new.js (no import cycles). */
export function groundTruth({ products = [], customers = [], sales = [] }) {
  const now = Date.now();
  const deadStockProducts = (products || []).filter((p) => {
    const prodSales = (sales || []).filter((s) => s.product_id === p.id);
    if (!prodSales.length) return true;
    const times = prodSales.map((s) => new Date(s.date || s.created_at || now).getTime()).filter(Boolean);
    if (!times.length) return true;
    return (now - Math.max(...times)) / 86400000 >= 45;
  });
  const dead = deadStockProducts[0] || null;
  const deadQty = dead?.stock_qty ?? 0;
  const deadValue = dead ? (Number(dead.sell_price) || 0) * deadQty : 0;
  const vipAtRisk = (customers || []).filter(
    (c) => Number(c.total_spent) >= 50000 && (now - new Date(c.last_purchase_date || c.created_at || now).getTime()) / 86400000 >= 30
  );
  const lowStock = (products || []).filter((p) => Number(p.stock_qty) <= 5).slice(0, 20);
  const overstock = (products || []).filter((p) => Number(p.stock_qty) >= 100).slice(0, 20);
  return {
    dead: dead ? { product_id: dead.id, name: dead.name, qty: deadQty, value: deadValue } : null,
    deadCount: deadStockProducts.length,
    vipAtRisk: vipAtRisk.slice(0, 20).map((c) => ({ customer_id: c.id, name: c.name, total_spent: c.total_spent })),
    vipAtRiskCount: vipAtRisk.length,
    lowStock: lowStock.map((p) => ({ product_id: p.id, name: p.name, stock_qty: p.stock_qty })),
    overstock: overstock.map((p) => ({ product_id: p.id, name: p.name, stock_qty: p.stock_qty })),
  };
}
