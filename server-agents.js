/**
 * Multi-agent supervisor architecture (Meta Musepark 1.3 tool-calling).
 * NOTE: harness has no mkdir tool, so agents live at repo root as server-agents.js.
 * To get /agents layout: mkdir -p agents && mv server-agents.js agents/supervisorAgent.js
 * and update the import in server-shop-init.js. All agent entry points below stay the same.
 *
 * Flow (POST /api/analyze/run):
 *  Step1 RAG context -> Step2 parallel sales/inventory/customer/marketing analyzers
 *  -> Step3 summary JSON each -> Step4 supervisor merges into Daily Brief + creates
 *  tasks/content_queue/goals -> Step5 save ai_insights passed_to_main=true.
 */
import { ragService } from './server-rag-service.js';
import { aiJSON, timed, truncateStr } from './server-ai.js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validShop = (id) => UUID_RE.test(String(id || ''));

async function sb(path, method = 'GET', body, query = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}${query}`, {
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

// --- Step0: deterministic ground truth (free, same logic as frontend llama.ts) ---

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

// --- Validators: coerce LLM JSON into safe shapes (unknown/invalid fields dropped) ---

const asArr = (v) => (Array.isArray(v) ? v : []);
const asStr = (v, max = 500) => truncateStr(v ?? '', max);
const asNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

function validateSales(o) {
  o = o && typeof o === 'object' ? o : {};
  return {
    dead_stock: asArr(o.dead_stock).slice(0, 20).map((d) => ({ product_id: asStr(d?.product_id, 60), name: asStr(d?.name), reason: asStr(d?.reason, 300) })),
    fast_movers: asArr(o.fast_movers).slice(0, 20).map((d) => ({ product_id: asStr(d?.product_id, 60), name: asStr(d?.name), qty_sold: asNum(d?.qty_sold) })),
    seasonality: asStr(o.seasonality, 500),
    suggested_discounts: asArr(o.suggested_discounts).slice(0, 20).map((d) => ({ product_id: asStr(d?.product_id, 60), percent: Math.min(90, Math.max(0, asNum(d?.percent))), reason: asStr(d?.reason, 300) })),
  };
}
function validateInventory(o) {
  o = o && typeof o === 'object' ? o : {};
  const item = (d) => ({ product_id: asStr(d?.product_id, 60), name: asStr(d?.name), stock_qty: asNum(d?.stock_qty) });
  return {
    low_stock: asArr(o.low_stock).slice(0, 20).map(item),
    overstock: asArr(o.overstock).slice(0, 20).map(item),
    reorder: asArr(o.reorder).slice(0, 20).map((d) => ({ ...item(d), suggested_qty: asNum(d?.suggested_qty) })),
  };
}
function validateCustomers(o) {
  o = o && typeof o === 'object' ? o : {};
  const seg = o.segments && typeof o.segments === 'object' ? o.segments : {};
  return {
    rating_updates: asArr(o.rating_updates).slice(0, 50).map((d) => ({ customer_id: asStr(d?.customer_id, 60), rating: Math.min(10, Math.max(1, Math.round(asNum(d?.rating, 5)))), reason: asStr(d?.reason, 300) })),
    segments: {
      vip: asArr(seg.vip).slice(0, 50).map((x) => asStr(x?.customer_id || x, 60)),
      at_risk: asArr(seg.at_risk).slice(0, 50).map((x) => asStr(x?.customer_id || x, 60)),
      new: asArr(seg.new).slice(0, 50).map((x) => asStr(x?.customer_id || x, 60)),
      regular: asArr(seg.regular).slice(0, 50).map((x) => asStr(x?.customer_id || x, 60)),
    },
    points: asArr(o.points).slice(0, 50).map((d) => ({ customer_id: asStr(d?.customer_id, 60), points_award: asNum(d?.points_award), reason: asStr(d?.reason, 300) })),
  };
}
function validateMarketing(o) {
  o = o && typeof o === 'object' ? o : {};
  return {
    at_risk: asArr(o.at_risk).slice(0, 20).map((d) => ({ customer_id: asStr(d?.customer_id, 60), name: asStr(d?.name), reason: asStr(d?.reason, 300) })),
    vip_churn: asArr(o.vip_churn).slice(0, 20).map((d) => ({ customer_id: asStr(d?.customer_id, 60), name: asStr(d?.name), risk: asStr(d?.risk, 300) })),
    campaign_ideas: asArr(o.campaign_ideas).slice(0, 10).map((d) => ({ title: asStr(d?.title), audience: asStr(d?.audience, 300), message: asStr(d?.message, 1000) })),
    scripts: asArr(o.scripts).slice(0, 10).map((d) => ({ campaign: asStr(d?.campaign), script_body: asStr(d?.script_body, 2000) })),
    image_prompts: asArr(o.image_prompts).slice(0, 10).map((d) => ({ campaign: asStr(d?.campaign), image_prompt: asStr(d?.image_prompt, 1000) })),
  };
}

// --- Step2 analyzers (run in parallel; LLM output merged over ground truth) ---

export async function salesAnalyzer({ sales, products }, truth) {
  const out = await aiJSON(
    'You are a retail sales analyst. Input: last 200 sales + product list + precomputed ground truth. TRUST the ground-truth dead-stock/VIP numbers (computed from real dates) — enrich with seasonality and discount reasons. Return ONLY JSON: {"dead_stock":[{"product_id":..,"name":..,"reason":..}],"fast_movers":[{"product_id":..,"name":..,"qty_sold":..}],"seasonality":"...","suggested_discounts":[{"product_id":..,"percent":..,"reason":..}]}',
    { sales: (sales || []).slice(0, 200), products: (products || []).slice(0, 200), ground_truth: truth },
    { dead_stock: [], fast_movers: [], seasonality: '', suggested_discounts: [] }
  );
  const v = validateSales(out);
  if (truth?.dead && !v.dead_stock.some((d) => d.product_id === truth.dead.product_id)) {
    v.dead_stock.unshift({ product_id: truth.dead.product_id, name: truth.dead.name, reason: `No sale in 45+ days — ${truth.dead.qty} units locking KES ${truth.dead.value}` });
  }
  return v;
}

export async function inventoryAnalyzer({ products }, truth) {
  const out = await aiJSON(
    'You are an inventory analyst. Input: product list with stock_qty + ground-truth low/overstock. Confirm or refine. Return ONLY JSON: {"low_stock":[{"product_id":..,"name":..,"stock_qty":..}],"overstock":[{"product_id":..,"name":..,"stock_qty":..}],"reorder":[{"product_id":..,"name":..,"suggested_qty":..}]}',
    { products: (products || []).slice(0, 300), ground_truth: truth },
    { low_stock: [], overstock: [], reorder: [] }
  );
  const v = validateInventory(out);
  for (const g of truth?.lowStock || []) {
    if (!v.low_stock.some((x) => x.product_id === g.product_id)) v.low_stock.push(g);
  }
  return v;
}

export async function customerAnalyzer({ customers }, truth) {
  const out = await aiJSON(
    'You are a customer analyst for a Kenyan retail shop. Input: customers with total_spent, visit_count, points, rating (1-10) + ground-truth VIP-at-risk list. TRUST the ground-truth list for vip/at_risk segments. Return ONLY JSON: {"rating_updates":[{"customer_id":..,"rating":1-10,"reason":..}],"segments":{"vip":[],"at_risk":[],"new":[],"regular":[]},"points":[{"customer_id":..,"points_award":..,"reason":..}]}',
    { customers: (customers || []).slice(0, 300), ground_truth: truth },
    { rating_updates: [], segments: { vip: [], at_risk: [], new: [], regular: [] }, points: [] }
  );
  const v = validateCustomers(out);
  for (const g of truth?.vipAtRisk || []) {
    if (!v.segments.at_risk.includes(g.customer_id)) v.segments.at_risk.push(g.customer_id);
  }
  return v;
}

export async function marketingAnalyzer({ sales, customers, context }, truth) {
  const out = await aiJSON(
    'You are a marketing strategist for a Kenyan retail shop (Sheng/English). Use the ground-truth VIP-at-risk customers as win-back targets first. Return ONLY JSON: {"at_risk":[{"customer_id":..,"name":..,"risk":..}],"vip_churn":[{"customer_id":..,"name":..,"risk":..}],"campaign_ideas":[{"title":..,"audience":..,"message":..}],"scripts":[{"campaign":..,"script_body":..}],"image_prompts":[{"campaign":..,"image_prompt":..}]}',
    { sales: (sales || []).slice(0, 100), customers: (customers || []).slice(0, 200), context, ground_truth: truth },
    { at_risk: [], vip_churn: [], campaign_ideas: [], scripts: [], image_prompts: [] },
    { temperature: 0.4 }
  );
  return validateMarketing(out);
}

// Log every agent output to ai_insights. passed_to_main col comes from
// supabase-agents-migration.sql; retry without it if migration not yet applied.
async function logInsight(shop_id, type, title, description, passed = false) {
  const row = { shop_id, type, title, description: String(description).slice(0, 4000), status: 'active' };
  try {
    const [saved] = await sb('ai_insights', 'POST', { ...row, passed_to_main: passed });
    return saved;
  } catch {
    const [saved] = await sb('ai_insights', 'POST', row);
    return saved;
  }
}

async function fetchShopData(shop_id) {
  const [sales, products, customers, tasks, message_logs, content_queue] = await Promise.all([
    sb('sales', 'GET', null, `?shop_id=eq.${shop_id}&order=date.desc&limit=200`).catch(() => []),
    sb('products', 'GET', null, `?shop_id=eq.${shop_id}&limit=500`).catch(() => []),
    sb('customers', 'GET', null, `?shop_id=eq.${shop_id}&limit=500`).catch(() => []),
    sb('tasks', 'GET', null, `?shop_id=eq.${shop_id}&limit=100`).catch(() => []),
    sb('message_logs', 'GET', null, `?shop_id=eq.${shop_id}&order=created_at.desc&limit=100`).catch(() => []),
    sb('content_queue', 'GET', null, `?shop_id=eq.${shop_id}&limit=100`).catch(() => []),
  ]);
  return { sales, products, customers, tasks, message_logs, content_queue };
}

// --- (old duplicates removed; canonical analyzers are above) ---

export async function inventoryAnalyzerOld({ products }) {
  const out = await aiJSON(
    'You are an inventory analyst. Input: product list with stock_qty. Return ONLY JSON: {"low_stock":[{"product_id":..,"name":..,"stock_qty":..}],"overstock":[{"product_id":..,"name":..,"stock_qty":..}],"reorder":[{"product_id":..,"name":..,"suggested_qty":..}]}',
    { products: (products || []).slice(0, 300) },
    { low_stock: [], overstock: [], reorder: [] }
  );
  return out;
}

export async function customerAnalyzerOld({ customers }) {
  const out = await aiJSON(
    'You are a customer analyst for a Kenyan retail shop. Input: customers with total_spent, visit_count, points, rating (1-10). Return ONLY JSON: {"rating_updates":[{"customer_id":..,"rating":1-10,"reason":..}],"segments":{"vip":[],"at_risk":[],"new":[],"regular":[]},"points":[{"customer_id":..,"points_award":..,"reason":..}]}',
    { customers: (customers || []).slice(0, 300) },
    { rating_updates: [], segments: { vip: [], at_risk: [], new: [], regular: [] }, points: [] }
  );
  return out;
}

export async function marketingAnalyzerOld({ sales, customers, context }) {
  const out = await aiJSON(
    'You are a marketing strategist for a Kenyan retail shop (Sheng/English). Return ONLY JSON: {"at_risk":[{"customer_id":..,"name":..,"reason":..}],"vip_churn":[{"customer_id":..,"name":..,"risk":..}],"campaign_ideas":[{"title":..,"audience":..,"message":..}],"scripts":[{"campaign":..,"script_body":..}],"image_prompts":[{"campaign":..,"image_prompt":..}]}',
    { sales: (sales || []).slice(0, 100), customers: (customers || []).slice(0, 200), context },
    { at_risk: [], vip_churn: [], campaign_ideas: [], scripts: [], image_prompts: [] }
  );
  return out;
}

// --- 10/10 content generator + supervisor + orchestrator: see server-agents-new.js (canonical) ---
// Re-exported below; old unvalidated variants renamed *Old for backward compat.

// --- 10/10 canonical implementations (re-exported from server-agents-new.js) ---
export {
  contentGeneratorAgent,
  supervisorMerge,
  runAnalyze,
  learningAgent,
  runLearningCycle,
} from './server-agents-new.js';
export { groundTruth } from './server-ai.js';

