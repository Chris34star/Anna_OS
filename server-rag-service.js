/**
 * RAG service: Xenova/all-MiniLM-L6-v2 (384-dim) embeddings + hybrid search.
 * Answers via Meta Musepark 1.3 (env AI_MODEL).
 * search(shop_id, query, limit=10): pgvector similarity 70% + keyword 30%.
 * Never touches schema. Uses Supabase REST + match_knowledge_base RPC (see supabase-rag-migration.sql).
 */
import { aiJSON, AI_MODEL, truncateStr } from './server-ai.js';
const SB_URL = () => process.env.SUPABASE_URL || '';
const SB_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let pipePromise = null;
async function getPipe() {
  if (!pipePromise) {
    pipePromise = import('@xenova/transformers').then(async ({ pipeline }) => {
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    });
  }
  return pipePromise;
}

// 384-dim normalized embedding. Falls back to hashed vector so writes never break.
export async function embedText(text) {
  const input = String(text || '').slice(0, 2000);
  try {
    const pipe = await getPipe();
    const out = await pipe(input, { pooling: 'mean', normalize: true });
    return Array.from(out.data);
  } catch {
    const v = new Array(384).fill(0);
    let h = 2166136261;
    const s = input.toLowerCase();
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
      v[Math.abs(h) % 384] += 1;
    }
    const n = Math.hypot(...v) || 1;
    return v.map((x) => x / n);
  }
}

const toLit = (v) => `[${v.map((x) => Number(x).toFixed(6)).join(',')}]`;

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

/** Build indexable content string for each write kind. */
export function buildContent(kind, row = {}) {
  switch (kind) {
    case 'sale':
      return `Sale: ${row.qty || 1}x ${row.product_name || row.product_id || 'item'} total ${row.total || 0} via ${row.payment_method || 'cash'}${row.customer_name ? ` to ${row.customer_name}` : ''} receipt ${row.receipt_no || ''} on ${row.date || row.created_at || 'today'}`;
    case 'customer':
      return `Customer note: ${row.name || ''} phone ${row.phone || ''} spent ${row.total_spent || 0} visits ${row.visit_count || 0} rating ${row.rating ?? ''} points ${row.points || 0}`;
    case 'note':
      return `Note: ${typeof row === 'string' ? row : row.content || row.note || JSON.stringify(row)}`;
    case 'task':
      return `Task [${row.type || 'general'}/${row.status || 'pending'}] role ${row.assigned_role || ''}: user notes: ${row.user_notes || ''} ai notes: ${row.ai_notes || ''}`;
    case 'goal':
      return `Goal: ${row.title || ''} target ${row.target_value || 0} current ${row.current_value || 0} status ${row.status || 'active'}`;
    case 'onboarding':
      return `Onboarding answer: ${typeof row === 'string' ? row : JSON.stringify(row)}`;
    case 'ai_chat':
      return `AI chat Q: ${row.question || ''} A: ${row.answer || ''}`;
    default:
      return typeof row === 'string' ? row : JSON.stringify(row);
  }
}

/** Index any write into knowledge_base with embedding. */
export async function indexWrite(shop_id, kind, row, sourceOverride) {
  const content = typeof row?.content === 'string' && kind === 'note' ? row.content : buildContent(kind, row);
  const embedding = await embedText(content);
  const [saved] = await sb('knowledge_base', 'POST', {
    shop_id,
    content,
    source_type: sourceOverride || (kind === 'ai_chat' ? 'ai_chat' : kind),
    embedding: toLit(embedding),
  });
  return saved;
}

/**
 * Hybrid search: pgvector similarity (70%) + keyword ILIKE (30%). Returns top docs.
 */
export async function search(shop_id, query, limit = 10) {
  const q = String(query || '');
  const emb = await embedText(q);
  // 1) vector matches via RPC (falls back to empty if RPC missing)
  let vec = [];
  try {
    const r = await fetch(`${SB_URL()}/rest/v1/rpc/match_knowledge_base`, {
      method: 'POST',
      headers: { apikey: SB_KEY(), Authorization: `Bearer ${SB_KEY()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_shop_id: shop_id, p_embedding: toLit(emb), p_limit: limit }),
    });
    if (r.ok) vec = await r.json();
  } catch { vec = []; }

  // 2) keyword matches (PostgREST ilike)
  let kw = [];
  try {
    kw = await sb('knowledge_base', 'GET', null, `?shop_id=eq.${shop_id}&content=ilike.*${encodeURIComponent(q.slice(0, 80))}*&limit=${limit}`);
  } catch { kw = []; }

  const scored = new Map();
  for (const d of vec) {
    const sim = Number(d.similarity ?? 0);
    scored.set(d.id, { ...d, _score: 0.7 * sim });
  }
  const kwIds = new Set(kw.map((d) => d.id));
  for (const d of kw) {
    const prev = scored.get(d.id);
    const kwScore = 0.3;
    scored.set(d.id, { ...(prev || d), _score: (prev?._score || 0) + kwScore, _kw: true });
  }
  // docs only in vec keep vector score; docs only in kw keep 0.3
  void kwIds;
  return [...scored.values()].sort((a, b) => b._score - a._score).slice(0, limit);
}

/** RAG query: search + Meta Musepark 1.3 (env AI_MODEL) answer, stores chat as ai_chat.
 *  answerQuery never throws: grounding fallback always available. */
export async function answerQuery(shop_id, question) {
  const q = String(question || '').slice(0, 1000);
  const docs = await search(shop_id, q, 10);
  const context = docs.map((d) => d.content).join('\n---\n');
  const out = await aiJSON(
    'You are DukaAI that knows this shop deeply use context. Answer using ONLY the provided shop context when possible; be concise, Sheng/English friendly. Return ONLY JSON: {"answer":"..."}',
    { context: truncateStr(context, 4000) || '(no context yet)', question: q },
    { answer: '' },
    { temperature: 0.3 }
  );
  const answer = (out.answer || '').trim() || (context
    ? `Based on your shop records:\n${docs.slice(0, 3).map((d) => `- ${d.content}`).join('\n')}`
    : 'No shop context found yet. Add sales, customers, or notes first.');
  // store AI chat (fire-and-forget safe)
  try {
    await indexWrite(shop_id, 'ai_chat', { question: q, answer }, 'ai_chat');
  } catch { /* never fail the query on logging */ }
  return { context, answer, docs };
}

export const ragService = { search, indexWrite, answerQuery, embedText, buildContent };
