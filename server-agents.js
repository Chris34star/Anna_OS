/**
 * Multi-agent supervisor architecture (Llama 3.1 70B tool-calling via Groq).
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

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

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

// Llama 3.1 70B JSON tool call with safe fallback.
async function llamaJSON(system, user, fallback) {
  if (!GROQ_API_KEY) return fallback;
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: typeof user === 'string' ? user : JSON.stringify(user).slice(0, 12000) },
        ],
      }),
    });
    if (!r.ok) return fallback;
    const j = await r.json();
    return JSON.parse(j.choices?.[0]?.message?.content || 'null') ?? fallback;
  } catch {
    return fallback;
  }
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

// --- Step2 analyzers (run in parallel) ---

export async function salesAnalyzer({ sales, products }) {
  const out = await llamaJSON(
    'You are a retail sales analyst. Input: last 200 sales + product list. Return ONLY JSON: {"dead_stock":[{"product_id":..,"name":..,"reason":..}],"fast_movers":[{"product_id":..,"name":..,"qty_sold":..}],"seasonality":"...","suggested_discounts":[{"product_id":..,"percent":..,"reason":..}]}',
    { sales: (sales || []).slice(0, 200), products: (products || []).slice(0, 200) },
    { dead_stock: [], fast_movers: [], seasonality: '', suggested_discounts: [] }
  );
  return out;
}

export async function inventoryAnalyzer({ products }) {
  const out = await llamaJSON(
    'You are an inventory analyst. Input: product list with stock_qty. Return ONLY JSON: {"low_stock":[{"product_id":..,"name":..,"stock_qty":..}],"overstock":[{"product_id":..,"name":..,"stock_qty":..}],"reorder":[{"product_id":..,"name":..,"suggested_qty":..}]}',
    { products: (products || []).slice(0, 300) },
    { low_stock: [], overstock: [], reorder: [] }
  );
  return out;
}

export async function customerAnalyzer({ customers }) {
  const out = await llamaJSON(
    'You are a customer analyst for a Kenyan retail shop. Input: customers with total_spent, visit_count, points, rating (1-10). Return ONLY JSON: {"rating_updates":[{"customer_id":..,"rating":1-10,"reason":..}],"segments":{"vip":[],"at_risk":[],"new":[],"regular":[]},"points":[{"customer_id":..,"points_award":..,"reason":..}]}',
    { customers: (customers || []).slice(0, 300) },
    { rating_updates: [], segments: { vip: [], at_risk: [], new: [], regular: [] }, points: [] }
  );
  return out;
}

export async function marketingAnalyzer({ sales, customers, context }) {
  const out = await llamaJSON(
    'You are a marketing strategist for a Kenyan retail shop (Sheng/English). Return ONLY JSON: {"at_risk":[{"customer_id":..,"name":..,"reason":..}],"vip_churn":[{"customer_id":..,"name":..,"risk":..}],"campaign_ideas":[{"title":..,"audience":..,"message":..}],"scripts":[{"campaign":..,"script_body":..}],"image_prompts":[{"campaign":..,"image_prompt":..}]}',
    { sales: (sales || []).slice(0, 100), customers: (customers || []).slice(0, 200), context },
    { at_risk: [], vip_churn: [], campaign_ideas: [], scripts: [], image_prompts: [] }
  );
  return out;
}

// --- contentGeneratorAgent: 5 daily content_queue rows from marketing output ---

export async function contentGeneratorAgent(shop_id, marketing) {
  const out = await llamaJSON(
    'You are a content creator for a Kenyan retail shop. Create EXACTLY 5 daily posts. Return ONLY JSON: {"items":[{"platform":"whatsapp_status"|"tiktok_reels"|"instagram_carousel"|"sms_drop","title":..,"hook":..,"script_body":..}]}',
    marketing,
    { items: [] }
  );
  const rows = (out.items || []).slice(0, 5).map((c) => ({
    shop_id,
    platform: c.platform || 'whatsapp_status',
    title: c.title || '',
    hook: c.hook || '',
    script_body: c.script_body || '',
    status: 'generated',
  }));
  if (!rows.length) return [];
  return sb('content_queue', 'POST', rows).catch(() => []);
}

// --- Step4 supervisor merge ---

export async function supervisorMerge(shop_id, summaries, ragContext) {
  const merged = await llamaJSON(
    'You are the DukaAI supervisor merging 4 analyst reports into one Daily Brief (concise, Sheng/English friendly). Return ONLY JSON: {"daily_brief":"...","tasks":[{"type":..,"assigned_role":..,"user_notes":..,"ai_notes":..}],"content_suggestions":[{"platform":..,"title":..,"hook":..,"script_body":..}],"goal_suggestions":[{"title":..,"target_value":..}]}',
    { ...summaries, rag_context: (ragContext || '').slice(0, 3000) },
    { daily_brief: '', tasks: [], content_suggestions: [], goal_suggestions: [] }
  );

  const taskRows = (merged.tasks || []).map((t) => ({
    shop_id, type: t.type || 'general', assigned_role: t.assigned_role || '',
    status: 'pending', user_notes: t.user_notes || '', ai_notes: t.ai_notes || '',
  }));
  const contentRows = (merged.content_suggestions || []).map((c) => ({
    shop_id, platform: c.platform || 'whatsapp_status', title: c.title || '',
    hook: c.hook || '', script_body: c.script_body || '', status: 'generated',
  }));
  const goalRows = (merged.goal_suggestions || []).map((g) => ({
    shop_id, title: g.title || '', target_value: g.target_value || 0,
    current_value: 0, status: 'active',
  }));
  const [tasks, content, goals] = await Promise.all([
    taskRows.length ? sb('tasks', 'POST', taskRows).catch(() => []) : [],
    contentRows.length ? sb('content_queue', 'POST', contentRows).catch(() => []) : [],
    goalRows.length ? sb('goals', 'POST', goalRows).catch(() => []) : [],
  ]);

  // Step5: final brief, passed_to_main=true
  const saved = await logInsight(shop_id, 'daily_brief', 'Daily Brief', merged.daily_brief || '(empty brief)', true);
  return { brief: merged.daily_brief, tasks, content, goals, insight: saved };
}

// --- Main orchestrator: POST /api/analyze/run ---

export async function runAnalyze(shop_id) {
  // Step1: RAG context
  let ragDocs = [];
  try {
    ragDocs = await ragService.search(shop_id, 'daily brief sales customers inventory stock', 10);
  } catch { ragDocs = []; }
  const ragContext = ragDocs.map((d) => d.content).join('\n---\n');

  const data = await fetchShopData(shop_id);

  // Step2: parallel analyzer calls
  const [sales, inventory, customers, marketing] = await Promise.all([
    salesAnalyzer(data),
    inventoryAnalyzer(data),
    customerAnalyzer(data),
    marketingAnalyzer({ ...data, context: ragContext.slice(0, 2000) }),
  ]);

  // Step3: each returns summary JSON -> log to ai_insights
  await Promise.all([
    logInsight(shop_id, 'sales_analysis', 'Sales analysis', JSON.stringify(sales)),
    logInsight(shop_id, 'inventory_analysis', 'Inventory analysis', JSON.stringify(inventory)),
    logInsight(shop_id, 'customer_analysis', 'Customer analysis', JSON.stringify(customers)),
    logInsight(shop_id, 'marketing_analysis', 'Marketing analysis', JSON.stringify(marketing)),
  ]);

  // contentGeneratorAgent runs after marketing
  const generated = await contentGeneratorAgent(shop_id, marketing);
  await logInsight(shop_id, 'content_generated', 'Daily content generated', `Created ${generated.length} content_queue items`);

  // Step4+5: supervisor merge + persist + final insight
  const result = await supervisorMerge(shop_id, { sales, inventory, customers, marketing }, ragContext);
  return { shop_id, summaries: { sales, inventory, customers, marketing }, generated, ...result };
}

// --- learningAgent: cron 6h — reads feedback, embeds learnings ---

export async function learningAgent(shop_id) {
  const data = await fetchShopData(shop_id);
  const feedback = {
    message_logs: (data.message_logs || []).slice(0, 50),
    task_notes: (data.tasks || []).map((t) => ({ user_notes: t.user_notes, ai_notes: t.ai_notes, status: t.status })).slice(0, 50),
    content_feedback: (data.content_queue || [])
      .filter((c) => ['selected', 'discarded'].includes(c.status))
      .map((c) => ({ title: c.title, status: c.status })).slice(0, 50),
  };
  const out = await llamaJSON(
    'You are a learning agent. From chat logs, task notes and content feedback (selected=good, discarded=bad), extract durable learnings. Return ONLY JSON: {"learnings":["..."]}',
    feedback,
    { learnings: [] }
  );
  const learnings = (out.learnings || []).slice(0, 20);
  for (const l of learnings) {
    try {
      await ragService.indexWrite(shop_id, 'learning', String(l), 'learning');
    } catch { /* never fail cron on one write */ }
  }
  await logInsight(shop_id, 'learning', 'Learning cycle', `Embedded ${learnings.length} learnings into knowledge_base`);
  return { shop_id, embedded: learnings.length };
}

export async function runLearningCycle(shop_id) {
  if (shop_id) return learningAgent(shop_id);
  const shops = await sb('shops', 'GET').catch(() => []);
  const results = [];
  for (const s of shops) {
    try {
      results.push(await learningAgent(s.id));
    } catch (e) {
      results.push({ shop_id: s.id, error: String((e && e.message) || e) });
    }
  }
  return results;
}
