import React, { useEffect, useState } from 'react';
import { Send, Zap } from 'lucide-react';

const API = (import.meta as any).env?.VITE_API_BASE || '';

/** /ai-chat page: full RAG chat with command execution. */
export const AIChatView: React.FC = () => {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: 'Karibu! I know this shop deeply. Ask about dead stock, VIPs, or tell me "Hide profit from cashiers".' },
  ]);

  const ask = async () => {
    const question = q.trim();
    if (!question || busy) return;
    setQ('');
    setMsgs((m) => [...m, { me: true, text: question }]);
    setBusy(true);
    try {
      const shopId = localStorage.getItem('anna_shop_id') || 'demo-shop';
      const r = await fetch(`${API}/api/ai-chat/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId, text: question }),
      });
      const j = await r.json();
      setMsgs((m) => [...m, { me: false, text: j.answer || j.error || 'No answer.' }]);
    } catch (e) {
      setMsgs((m) => [...m, { me: false, text: `Offline: ${String((e as Error).message)}` }]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const v = (window as any).__annaChatPrompt as string | undefined;
    if (v) { (window as any).__annaChatPrompt = undefined; setQ(v); }
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">AI CHAT · RAG</span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Powered by Llama 3</span>
      </div>
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2 min-h-[50vh] text-sm">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] px-3 py-2 rounded-xl ${m.me ? 'ml-auto bg-emerald-500/15 text-emerald-100 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-200 border border-neutral-800'}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="text-neutral-500 text-xs">Thinking…</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask()}
          placeholder='Ask anything or command — "Hide profit from cashiers", "What about dead stock?"'
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
        />
        <button onClick={ask} className="p-2.5 rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
