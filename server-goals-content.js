/**
 * Goals + Content + Task-notes endpoints (Llama 3.1 70B via Groq, RAG-backed).
 * Mounted by server-shop-init.js. All writes also indexed to knowledge_base
 * (source_type goal / content_feedback / task_user_note) so AI reads them next time.
 */
import { ragService } from './server-rag-service.js';
import { contentGeneratorAgent, marketingAnalyzer } from './server-agents.js';
import { checkSubscription } from './server-payments.js';

const SB_URL = () => process.env.SUPABASE_URL || '';
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const GROQ_KEY = () => process.env.GROQ_API_KEY || '';

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

async function llamaExtractGoal(text) {
  const fallback = { title: String(text).slice(0, 120), target_value: 500000 };
  if (!GROQ_KEY()) {
    const m = String(text).match(/([\d,.]+)\s*k/i);
    if (m) fallback.target_value = Number(m[1].replace(/[,.]/g, '')) * 1000;
    return fallback;
  }
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY()}` },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Extract a retail goal from chat. Return ONLY JSON: {"title":"...","target_value":number}. E.g. "Set goal to reach 500k" -> {"title":"Reach 500k revenue","target_value":500000}.' },
          { role: 'user', content: String(text).slice(0, 1000) },
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

export function mountGoalsContentTasks(app) {
  // POST /api/goals — user text or AI creates goal; AI placeholder parsed via RAG+LLM
  app.post('/api/goals', async (req, res) => {
    try {
      const { shop_id = null, title = '', target_value = null, text = '' } = req.body || {};
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const input = text || title;
      if (!input) return res.status(400).json({ error: 'title or text required' });
      // RAG context so AI names goals that fit the shop ("Set goal to reach 500k")
      let extracted = { title: input, target_value: target_value ?? 0 };
      try {
        const docs = await ragService.search(shop_id, input, 5);
        extracted = await llamaExtractGoal(`${input}\nShop context: ${docs.map((d) => d.content).join(' | ').slice(0, 800)}`);
        if (target_value != null) extracted.target_value = target_value;
      } catch { /* keep raw input */ }
      const [goal] = await sb('goals', 'POST', {
        shop_id, title: extracted.title, target_value: extracted.target_value || 0,
        current_value: 0, status: 'active',
      });
      try {
        await ragService.indexWrite(shop_id, 'goal', { title: goal.title, target_value: goal.target_value, current_value: 0, status: 'active' }, 'goal');
      } catch { /* never fail create on indexing */ }
      res.json({ goal });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // GET /api/goals?shop_id=&status=active|archived (achieved listed via status=achieved too)
  app.get('/api/goals', async (req, res) => {
    try {
      const shop_id = req.query.shop_id;
      const status = req.query.status || 'active';
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const goals = await sb('goals', 'GET', null, `?shop_id=eq.${shop_id}&status=eq.${status}&order=created_at.desc&limit=100`);
      res.json({ goals });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // POST /api/goals/check — supervisor compares current_value vs target from sales
  app.post('/api/goals/check', async (req, res) => {
    try {
      const { shop_id = null } = req.body || {};
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const active = await sb('goals', 'GET', null, `?shop_id=eq.${shop_id}&status=eq.active&limit=100`).catch(() => []);
      const sales = await sb('sales', 'GET', null, `?shop_id=eq.${shop_id}&order=date.desc&limit=500`).catch(() => []);
      const revenue = sales.reduce((s, r) => s + Number(r.total || 0), 0);
      const updated = [];
      for (const g of active) {
        const current = Math.max(Number(g.current_value || 0), revenue);
        if (current >= Number(g.target_value || 0) && Number(g.target_value || 0) > 0) {
          const [done] = await sb('goals', 'PATCH', { status: 'achieved', current_value: current, achieved_at: new Date().toISOString() }, `?id=eq.${g.id}`);
          try {
            await sb('ai_insights', 'POST', { shop_id, type: 'goal_achieved', title: `Goal achieved: ${g.title}`, description: `Target ${g.target_value} reached (current ${current}).`, status: 'active' });
            await ragService.indexWrite(shop_id, 'goal', { title: g.title, target_value: g.target_value, current_value: current, status: 'achieved' }, 'goal');
          } catch { /* log best-effort */ }
          updated.push(done || { ...g, status: 'achieved', current_value: current });
        } else if (current !== Number(g.current_value || 0)) {
          const [prog] = await sb('goals', 'PATCH', { current_value: current }, `?id=eq.${g.id}`);
          updated.push(prog || { ...g, current_value: current });
        }
      }
      res.json({ checked: active.length, revenue, updated });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // POST /api/content/generate — content area default empty; generates 5 items (plan-gated)
  app.post('/api/content/generate', checkSubscription, async (req, res) => {
    try {
      const { shop_id = null } = req.body || {};
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const [sales, customers] = await Promise.all([
        sb('sales', 'GET', null, `?shop_id=eq.${shop_id}&order=date.desc&limit=100`).catch(() => []),
        sb('customers', 'GET', null, `?shop_id=eq.${shop_id}&limit=200`).catch(() => []),
      ]);
      let ragContext = '';
      try {
        const docs = await ragService.search(shop_id, 'campaign content marketing ideas', 5);
        ragContext = docs.map((d) => d.content).join('\n');
      } catch { /* generate without context */ }
      const marketing = await marketingAnalyzer({ sales, customers, context: ragContext });
      const items = await contentGeneratorAgent(shop_id, marketing);
      res.json({ items });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // GET /api/content?shop_id= — cards; empty default until generated
  app.get('/api/content', async (req, res) => {
    try {
      const shop_id = req.query.shop_id;
      if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
      const items = await sb('content_queue', 'GET', null, `?shop_id=eq.${shop_id}&order=created_at.desc&limit=50`);
      res.json({ items });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // PATCH /api/content/:id — Select (selected + creates Task type marketing) / Discard (discarded -> learningAgent)
  app.patch('/api/content/:id', async (req, res) => {
    try {
      const { shop_id = null, action = '' } = req.body || {};
      const id = req.params.id;
      if (!shop_id || !['select', 'discard'].includes(action)) {
        return res.status(400).json({ error: 'shop_id and action=select|discard required' });
      }
      const status = action === 'select' ? 'selected' : 'discarded';
      const [item] = await sb('content_queue', 'PATCH', { status, curation_state: status }, `?id=eq.${id}`);
      let task = null;
      if (action === 'select') {
        [task] = await sb('tasks', 'POST', {
          shop_id, type: 'marketing', assigned_role: '',
          status: 'pending',
          user_notes: '', ai_notes: `Post selected content: ${item?.title || id} — ${item?.hook || ''}`,
        }).catch(() => [null]);
      }
      try {
        await ragService.indexWrite(shop_id, 'note', `${action}d content "${item?.title || id}": ${item?.script_body || ''}`.slice(0, 1500), 'content_feedback');
      } catch { /* best-effort */ }
      res.json({ item: item || { id, status }, task });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });

  // PATCH /api/tasks/:id/note — user note ("Customer rude") -> task.user_notes + knowledge_base task_user_note
  app.patch('/api/tasks/:id/note', async (req, res) => {
    try {
      const { shop_id = null, note = '' } = req.body || {};
      const id = req.params.id;
      if (!shop_id || !note) return res.status(400).json({ error: 'shop_id and note required' });
      const [existing] = await sb('tasks', 'GET', null, `?id=eq.${id}&limit=1`).catch(() => [null]);
      const prev = (existing && existing.user_notes) || '';
      const merged = prev ? `${prev}\n${note}` : note;
      const [task] = await sb('tasks', 'PATCH', { user_notes: merged }, `?id=eq.${id}`);
      let kb = null;
      try {
        kb = await ragService.indexWrite(shop_id, 'note', `Task ${id} user note: ${note}`, 'task_user_note');
      } catch { /* best-effort */ }
      res.json({ task: task || { id, user_notes: merged }, indexed: Boolean(kb) });
    } catch (e) {
      res.status(500).json({ error: String((e && e.message) || e) });
    }
  });
}
