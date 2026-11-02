// Frontend Supabase client. Uses import.meta.env only - never hardcode *.supabase.co URLs.
// Server code (server-shop-init.js) uses SUPABASE_URL + SERVICE_ROLE_KEY, never this file.
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(URL && ANON);

async function rest(table: string, opts: { method?: string; query?: string; body?: unknown; shopId?: string } = {}) {
  if (!isSupabaseConfigured) throw new Error('Supabase not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
  const q = opts.query ? `?${opts.query}` : '';
  const headers: Record<string, string> = {
    apikey: ANON!,
    Authorization: `Bearer ${ANON}`,
    'Content-Type': 'application/json',
  };
  const r = await fetch(`${URL}/rest/v1/${table}${q}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) throw new Error(`supabase ${table}: ${r.status} ${await r.text()}`);
  return r.json();
}

/** POST onboarding answers to backend -> creates shop + shop_navs (is_approved=false) + roles. */
export async function initShop(payload: { answers: unknown; owner_id?: string; shop_name?: string; currency?: string }) {
  const base = (import.meta.env.VITE_API_BASE as string | undefined) || '';
  const r = await fetch(`${base}/api/shop/init`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`shop/init: ${r.status} ${await r.text()}`);
  return r.json() as Promise<{ shop: unknown; template_key: string; navs: unknown[]; roles: unknown[] }>;
}

/** RAG: index a write (sale/customer/note/task/goal/onboarding) into knowledge_base. */
export async function ragIndex(payload: { shop_id: string; kind: string; row: unknown }) {
  const base = (import.meta.env.VITE_API_BASE as string | undefined) || '';
  const r = await fetch(`${base}/api/rag/index`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`rag/index: ${r.status} ${await r.text()}`);
  return r.json() as Promise<{ saved: unknown }>;
}

/** RAG: ask DukaAI with shop context. Returns { context, answer, docs }. */
export async function ragQuery(payload: { shop_id: string; question: string }) {
  const base = (import.meta.env.VITE_API_BASE as string | undefined) || '';
  const r = await fetch(`${base}/api/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`rag/query: ${r.status} ${await r.text()}`);
  return r.json() as Promise<{ context: string; answer: string; docs: unknown[] }>;
}

async function api<T>(path: string, opts: { method?: string; body?: unknown; query?: string } = {}): Promise<T> {
  const base = (import.meta.env.VITE_API_BASE as string | undefined) || '';
  const r = await fetch(`${base}${path}${opts.query || ''}`, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
  return r.json() as Promise<T>;
}

/** POS: record sale (deducts stock, updates customer, recalcs rating, embeds KB). */
export const pos = {
  sale: (b: { shop_id: string; product_id: string; customer_phone?: string; customer_id?: string; qty?: number; payment_method?: string }) =>
    api<{ sale: unknown; receipt_no: string }>(`/api/pos/sale`, { method: 'POST', body: b }),
};

/** Customers: rating recalc + detail (rating/points/revenue/history). */
export const customers = {
  recalc: (shop_id: string) =>
    api<{ updated: number }>(`/api/customers/recalculate-ratings`, { method: 'POST', body: { shop_id } }),
  detail: (id: string) => api<{ customer: unknown; rating: number | null; points: number; revenue: number; history: unknown[] }>(`/api/customers/${id}`),
};

/** Sales history with filters + pagination. */
export const sales = {
  history: (q: { shop_id: string; date_from?: string; date_to?: string; customer_id?: string; rating?: string; product_id?: string; page?: string; pageSize?: string }) => {
    const qs = new URLSearchParams(q as Record<string, string>).toString();
    return api<{ sales: unknown[]; page: number; pageSize: number }>(`/api/sales/history`, { query: `?${qs}` });
  },
};

/** Messaging: send (wa.me fallback) + log status. */
export const messaging = {
  send: (b: { shop_id: string; task_id?: string; customer_ids: string[]; content: string; channel?: string }) =>
    api<{ results: { customer_id: string; phone: string; status: string; link: string; log_id: string | null }[] }>(`/api/messaging/send`, { method: 'POST', body: b }),
  markStatus: (id: string, status: string) =>
    api<{ log: unknown }>(`/api/message-log/${id}/status`, { method: 'PATCH', body: { status } }),
};

/** Settings: connectors CRUD. */
export const connectors = {
  list: (shop_id: string) => api<{ connectors: unknown[] }>(`/api/connectors`, { query: `?shop_id=${shop_id}` }),
  create: (b: { shop_id: string; type: string; credentials?: unknown; is_connected?: boolean }) =>
    api(`/api/connectors`, { method: 'POST', body: b }),
  update: (id: string, b: Record<string, unknown>) => api(`/api/connectors/${id}`, { method: 'PATCH', body: b }),
  remove: (id: string) => api(`/api/connectors/${id}`, { method: 'DELETE' }),
};

export const supa = { rest, initShop, ragIndex, ragQuery, pos, customers, sales, messaging, connectors, isSupabaseConfigured };
