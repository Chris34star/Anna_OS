import React, { useEffect, useState } from 'react';
import { Bot, Send, X, Zap } from 'lucide-react';

const API = (import.meta as any).env?.VITE_API_BASE || '';

/** Global AI chat bubble: every page, bottom-right. RAG + commands via /api/ai-chat/command. */
export const ChatBubble: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<{ me: boolean; text: string }[]>([
    { me: false, text: 'Habari! Ask me anything — try "What about dead stock?" or "Hide profit from cashiers".' },
  ]);

  const ask = async (text?: string) => {
    const question = (text ?? q).trim();
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
    const go = () => setOpen(true);
    window.addEventListener('anna:open-chat', go);
    return () => window.removeEventListener('anna:open-chat', go);
  }, []);

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-13 h-13 p-3.5 rounded-full bg-emerald-500 text-neutral-950 shadow-xl shadow-emerald-500/30 hover:bg-emerald-400"
          title="Ask DukaAI"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-80 max-w-[calc(100vw-2rem)] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> DukaAI
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400">Llama 3</span>
            </div>
            <button onClick={() => setOpen(false)} className="p-1 text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-2 text-xs">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-2.5 py-1.5 rounded-xl ${m.me ? 'ml-auto bg-emerald-500/15 text-emerald-100 border border-emerald-500/30' : 'bg-neutral-900 text-neutral-200 border border-neutral-800'}`}>
                {m.text}
              </div>
            ))}
            {busy && <div className="text-neutral-500 text-[11px]">Thinking…</div>}
          </div>
          <div className="flex items-center gap-1.5 p-2 border-t border-neutral-800">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="Ask or command…"
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            <button onClick={() => ask()} className="p-2 rounded-xl bg-emerald-500 text-neutral-950 hover:bg-emerald-400"><Send className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}
    </>
  );
};
