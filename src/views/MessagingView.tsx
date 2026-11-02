import React, { useState } from 'react';
import { Check, Copy, Mail, MessageSquare, Send, Smartphone, Zap } from 'lucide-react';

const API = (import.meta as any).env?.VITE_API_BASE || '';
const shopId = () => localStorage.getItem('anna_shop_id') || 'demo-shop';

type Channel = 'whatsapp' | 'email' | 'sms';

/** Messaging page: WhatsApp / Email / SMS tabs, task customer list, API or wa.me manual flow. */
export const MessagingView: React.FC = () => {
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [taskId, setTaskId] = useState('');
  const [customerIds, setCustomerIds] = useState('');
  const [content, setContent] = useState('Habari! New stock just landed — karibu sana. 🛍️');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const send = async (manual: boolean) => {
    setBusy(true);
    try {
      const ids = customerIds.split(/[\s,]+/).filter(Boolean);
      // load customers for manual wa.me flow
      const enriched: any[] = [];
      for (const id of ids) {
        try {
          const r = await fetch(`${API}/api/customers/${id}`);
          if (r.ok) { const j = await r.json(); enriched.push({ customer_id: id, phone: j.customer?.phone || '', status: 'wa_me_link', link: `https://wa.me/${String(j.customer?.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(content)}`, log_id: null }); }
        } catch {}
      }
      if (manual) { setResults(enriched); return; }
      const r = await fetch(`${API}/api/messaging/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId(), task_id: taskId || undefined, customer_ids: ids, content, channel }),
      });
      const j = await r.json();
      setResults(j.results || []);
    } finally {
      setBusy(false);
    }
  };

  const markSent = async (logId: string) => {
    if (!logId) return;
    await fetch(`${API}/api/message-log/${logId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' }),
    }).catch(() => {});
    setResults((rs) => rs.map((x) => (x.log_id === logId ? { ...x, status: 'sent' } : x)));
  };

  const copy = (link: string) => {
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopied(link);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">MESSAGING</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Powered by Llama 3</span>
      </div>

      <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl w-fit">
        {([['whatsapp', 'WhatsApp', MessageSquare], ['email', 'Email', Mail], ['sms', 'SMS', Smartphone]] as const).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setChannel(k)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg ${channel === k ? 'bg-emerald-500/15 text-emerald-300' : 'text-neutral-400 hover:text-white'}`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <input value={taskId} onChange={(e) => setTaskId(e.target.value)} placeholder="Task ID (optional)" className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500" />
        <input value={customerIds} onChange={(e) => setCustomerIds(e.target.value)} placeholder="Customer IDs (comma separated)" className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500" />
      </div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Message content…" className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500" />

      <div className="flex gap-2">
        <button onClick={() => send(false)} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50">
          <Send className="w-3.5 h-3.5" /> {busy ? 'Sending…' : 'Send via API'}
        </button>
        <button onClick={() => send(true)} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 disabled:opacity-50">
          <Smartphone className="w-3.5 h-3.5" /> Send Manually (wa.me)
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-900 text-neutral-400 uppercase text-[10px] tracking-wider">
              <tr><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Phone</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {results.map((r, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 font-mono text-neutral-300">{r.customer_id}</td>
                  <td className="px-4 py-2 font-mono text-neutral-400">{r.phone}</td>
                  <td className="px-4 py-2"><span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px]">{r.status}</span></td>
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex gap-1.5">
                      {r.link && (
                        <a href={r.link} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-lg bg-[#25D366]/10 text-[#25D366] text-[11px] font-bold">Open wa.me</a>
                      )}
                      {r.link && (
                        <button onClick={() => copy(r.link)} className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white">{copied === r.link ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}</button>
                      )}
                      {r.log_id && r.status !== 'sent' && (
                        <button onClick={() => markSent(r.log_id)} className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[11px] font-bold">Mark Sent</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
