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

export const supa = { rest, initShop, isSupabaseConfigured };
