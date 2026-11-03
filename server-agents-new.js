/**
 * Multi-agent supervisor architecture (Meta Musepark 1.3 tool-calling via server-ai.js).
 * NOTE: harness has no mkdir tool, so agents live at repo root as server-agents.js.
 * To get /agents layout: mkdir -p agents && mv server-agents.js agents/supervisorAgent.js
 * and update the import in server-shop-init.js. All agent entry points below stay the same.
 *
 * Flow (POST /api/analyze/run):
 *  Step0 validate shop + precompute ground truth (deterministic, free)
 *  Step1 RAG context (timed) -> Step2 parallel analyzers -> Step3 summary JSON each
 *  -> Step4 supervisor merges deterministic + LLM into Daily Brief + creates
 *  tasks/content_queue/goals -> Step5 save ai_insights passed_to_main=true.
 * Every step: timeout+retry (server-ai.js), schema-validated, metrics-logged.
 */
import { ragService } from './server-rag-service.js';
import { aiJSON, timed, truncateStr, groundTruth } from './server-ai.js';

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

// --- Step0: deterministic ground truth lives in server-ai.js (shared, no cycles) ---

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
  // Ground-truth guard: LLM must not drop real dead stock.
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
    'You are a marketing strategist for a Kenyan retail shop (Sheng/English). Use the ground-truth VIP-at-risk customers as win-back targets first. Return ONLY JSON: {"at_risk":[{"customer_id":..,"name":..,"reason":..}],"vip_churn":[{"customer_id":..,"name":..,"risk":..}],"campaign_ideas":[{"title":..,"audience":..,"message":..}],"scripts":[{"campaign":..,"script_body":..}],"image_prompts":[{"campaign":..,"image_prompt":..}]}',
    { sales: (sales || []).slice(0, 100), customers: (customers || []).slice(0, 200), context, ground_truth: truth },
    { at_risk: [], vip_churn: [], campaign_ideas: [], scripts: [], image_prompts: [] },
    { temperature: 0.4 }
  );
  return validateMarketing(out);
}

// --- contentGeneratorAgent: 5 daily content_queue rows from marketing output ---

export async function contentGeneratorAgent(shop_id, marketing) {
  const out = await aiJSON(
    'You are a content creator for a Kenyan retail shop. Create EXACTLY 5 daily posts. Return ONLY JSON: {"items":[{"platform":"whatsapp_status"|"tiktok_reels"|"instagram_carousel"|"sms_drop","title":..,"hook":..,"script_body":..}]}',
    marketing,
    { items: [] },
    { temperature: 0.5 }
  );
  const items = asArr(out.items).slice(0, 10);
  const allowed = new Set(['whatsapp_status', 'tiktok_reels', 'instagram_carousel', 'sms_drop']);
  const rows = [];
  for (const c of items) {
    const title = asStr(c?.title, 200);
    const script_body = asStr(c?.script_body, 2000);
    if (!title || !script_body) continue; // drop empty generations
    rows.push({
      shop_id,
      platform: allowed.has(c?.platform) ? c.platform : 'whatsapp_status',
      title, hook: asStr(c?.hook, 500), script_body,
      status: 'generated',
      curation_state: 'new_daily',
    });
    if (rows.length >= 5) break;
  }
  if (!rows.length) return [];
  return sb('content_queue', 'POST', rows).catch(() => []);
}

// --- Step4 supervisor merge ---

export async function supervisorMerge(shop_id, summaries, ragContext, truth) {
  const merged = await aiJSON(
    'You are the DukaAI supervisor merging 4 analyst reports + deterministic ground truth into one Daily Brief (concise, Sheng/English friendly). TRUST ground-truth numbers over analyst estimates when they conflict. Return ONLY JSON: {"daily_brief":"...","tasks":[{"type":..,"assigned_role":..,"user_notes":..,"ai_notes":..}],"content_suggestions":[{"platform":..,"title":..,"hook":..,"script_body":..}],"goal_suggestions":[{"title":..,"target_value":..}]}',
    { ...summaries, ground_truth: truth, rag_context: truncateStr(ragContext || '', 3000) },
    { daily_brief: '', tasks: [], content_suggestions: [], goal_suggestions: [] }
  );

  const allowedPlat = new Set(['whatsapp_status', 'tiktok_reels', 'instagram_carousel', 'sms_drop']);
  const taskRows = asArr(merged.tasks).slice(0, 20)
    .filter((t) => asStr(t?.user_notes || t?.ai_notes || t?.type, 200))
    .map((t) => ({
      shop_id, type: asStr(t?.type, 60) || 'general', assigned_role: asStr(t?.assigned_role, 60) || '',
      status: 'pending', user_notes: asStr(t?.user_notes, 1000), ai_notes: asStr(t?.ai_notes, 1000),
    }));
  const contentRows = asArr(merged.content_suggestions).slice(0, 10)
    .filter((c) => asStr(c?.title, 200) && asStr(c?.script_body, 2000))
    .map((c) => ({
      shop_id, platform: allowedPlat.has(c?.platform) ? c.platform : 'whatsapp_status', title: asStr(c?.title, 200),
      hook: asStr(c?.hook, 500), script_body: asStr(c?.script_body, 2000), status: 'generated',
      curation_state: 'new_daily',
    }));
  const goalRows = asArr(merged.goal_suggestions).slice(0, 10)
    .filter((g) => asStr(g?.title, 200))
    .map((g) => ({
      shop_id, title: asStr(g?.title, 200), target_value: Math.max(0, asNum(g?.target_value)),
      current_value: 0, status: 'active',
    }));
  const [tasks, content, goals] = await Promise.all([
    taskRows.length ? sb('tasks', 'POST', taskRows).catch(() => []) : [],
    contentRows.length ? sb('content_queue', 'POST', contentRows).catch(() => []) : [],
    goalRows.length ? sb('goals', 'POST', goalRows).catch(() => []) : [],
  ]);

  // Step5: final brief, passed_to_main=true (deterministic fallback when LLM empty)
  const brief = asStr(merged.daily_brief, 4000) || (truth?.dead
    ? `Today: ${truth.dead.qty}x ${truth.dead.name} idle 45+ days (KES ${truth.dead.value}). ${truth.vipAtRiskCount} VIPs need win-back.`
    : 'Shop data analyzed — no urgent actions today.');
  const saved = await logInsight(shop_id, 'daily_brief', 'Daily Brief', brief, true);
  return { brief, tasks, content, goals, insight: saved };
}

// --- Main orchestrator: POST /api/analyze/run ---

export async function runAnalyze(shop_id, opts = {}) {
  const t0 = Date.now();
  if (!validShop(shop_id)) throw new Error('invalid shop_id (expect uuid)');
  const metrics = {};

  // Step0: shop must exist (fail fast on bad id)
  const shop = await sb('shops', 'GET', null, `?id=eq.${shop_id}&limit=1`).catch(() => []);
  if (!shop?.length) throw new Error('shop not found');

  // Step1: RAG context (timed, smaller when only Brief needed)
  const ragQ = opts.briefOnly ? 'daily brief sales dead stock vip' : 'daily brief sales customers inventory stock';
  const { v: ragDocs, ms: ragMs } = await timed(() =>
    ragService.search(shop_id, ragQ, 10).catch(() => [])
  );
  metrics.ragMs = ragMs;
  const ragContext = (ragDocs || []).map((d) => d.content).join('\n---\n');

  const data = await fetchShopData(shop_id);
  const truth = groundTruth(data);

  // Step2: parallel analyzer calls (each timed; ground truth guards hallucination)
  const [sR, iR, cR, mR] = await Promise.all([
    timed(() => salesAnalyzer(data, truth)),
    timed(() => inventoryAnalyzer(data, truth)),
    timed(() => customerAnalyzer(data, truth)),
    timed(() => marketingAnalyzer({ ...data, context: truncateStr(ragContext, 2000) }, truth)),
  ]);
  const sales = sR.v, inventory = iR.v, customers = cR.v, marketing = mR.v;
  metrics.analyzersMs = { sales: sR.ms, inventory: iR.ms, customers: cR.ms, marketing: mR.ms };

  if (opts.briefOnly) {
    // Cheap mode: supervisor brief only, no content generation, no 4 insight logs.
    const result = await supervisorMerge(shop_id, { sales, inventory, customers, marketing }, ragContext, truth);
    metrics.totalMs = Date.now() - t0;
    return { shop_id, mode: 'briefOnly', truth, metrics, ...result };
  }

  // Step3: each returns summary JSON -> log to ai_insights
  await Promise.all([
    logInsight(shop_id, 'sales_analysis', 'Sales analysis', JSON.stringify(sales)),
    logInsight(shop_id, 'inventory_analysis', 'Inventory analysis', JSON.stringify(inventory)),
    logInsight(shop_id, 'customer_analysis', 'Customer analysis', JSON.stringify(customers)),
    logInsight(shop_id, 'marketing_analysis', 'Marketing analysis', JSON.stringify(marketing)),
  ]);

  // contentGeneratorAgent runs after marketing (with 1x retry baked into aiJSON)
  const { v: generated, ms: contentMs } = await timed(() => contentGeneratorAgent(shop_id, marketing));
  metrics.contentMs = contentMs;
  await logInsight(shop_id, 'content_generated', 'Daily content generated', `Created ${(generated || []).length} content_queue items`);

  // Step4+5: supervisor merge + persist + final insight
  const result = await supervisorMerge(shop_id, { sales, inventory, customers, marketing }, ragContext, truth);
  metrics.totalMs = Date.now() - t0;
  return { shop_id, mode: 'full', truth, metrics, summaries: { sales, inventory, customers, marketing }, generated, ...result };
}

// --- learningAgent: cron 6h — reads feedback, embeds learnings ---

export async function learningAgent(shop_id) {
  if (!validShop(shop_id)) throw new Error('invalid shop_id (expect uuid)');
  const data = await fetchShopData(shop_id);
  const feedback = {
    message_logs: (data.message_logs || []).slice(0, 50),
    task_notes: (data.tasks || []).map((t) => ({ user_notes: t.user_notes, ai_notes: t.ai_notes, status: t.status })).slice(0, 50),
    content_feedback: (data.content_queue || [])
      .filter((c) => ['selected', 'discarded'].includes(c.status))
      .map((c) => ({ title: c.title, status: c.status })).slice(0, 50),
  };
  const out = await aiJSON(
    'You are a learning agent. From chat logs, task notes and content feedback (selected=good, discarded=bad), extract durable learnings. Return ONLY JSON: {"learnings":["..."]}',
    feedback,
    { learnings: [] }
  );
  const learnings = asArr(out.learnings).map((l) => asStr(l, 1000)).filter(Boolean).slice(0, 20);
  let embedded = 0;
  // Bounded parallelism: 5 at a time so one slow embed can't stall the cron.
  for (let i = 0; i < learnings.length; i += 5) {
    const batch = learnings.slice(i, i + 5);
    const res = await Promise.all(batch.map((l) =>
      ragService.indexWrite(shop_id, 'learning', String(l), 'learning').then(() => 1).catch(() => 0)
    ));
    embedded += res.reduce((a, b) => a + b, 0);
  }
  await logInsight(shop_id, 'learning', 'Learning cycle', `Embedded ${embedded} learnings into knowledge_base`);
  return { shop_id, embedded };
}

export async function runLearningCycle(shop_id) {
  if (shop_id) return learningAgent(shop_id);
  const shops = await sb('shops', 'GET').catch(() => []);
  const results = [];
  // Sequential per shop (cron-safe: one bad shop can't break the rest).
  for (const s of shops) {
    try {
      results.push(await learningAgent(s.id));
    } catch (e) {
      results.push({ shop_id: s.id, error: String((e && e.message) || e) });
    }
  }
  return results;
}
