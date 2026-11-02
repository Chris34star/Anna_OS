import React, { useEffect, useState } from 'react';
import { Archive, CheckCircle2, RefreshCw, Target, Trash2, Zap } from 'lucide-react';

const API = (import.meta as any).env?.VITE_API_BASE || '';
const shopId = () => localStorage.getItem('anna_shop_id') || 'demo-shop';

type Goal = { id: string; title: string; target_value: number; current_value: number; status: string; achieved_at?: string };
type Insight = { id: string; type: string; title: string; description: string; created_at: string };
type Task = { id: string; type: string; assigned_role: string; status: string; user_notes: string; ai_notes: string };

/** Dashboard: Daily Brief + goals progress + active/achieved/archived tabs + 3 AI insights + task columns. */
export const DashboardView: React.FC = () => {
  const [tab, setTab] = useState<'active' | 'achieved' | 'archived'>('active');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const load = async () => {
    try {
      const [g, gi, t] = await Promise.all([
        fetch(`${API}/api/goals?shop_id=${shopId()}&status=${tab === 'archived' ? 'archived' : tab}`).then((r) => r.json()).catch(() => ({ goals: [] })),
        fetch(`${API}/api/insights?shop_id=${shopId()}&limit=10`).then((r) => r.json()).catch(() => ({ insights: [] })),
        fetch(`${API}/api/tasks?shop_id=${shopId()}`).then((r) => r.json()).catch(() => ({ tasks: [] })),
      ]);
      setGoals(g.goals || []);
      setInsights((gi.insights || []).slice(0, 10));
      setTasks(t.tasks || []);
      const daily = (gi.insights || []).find((i: Insight) => i.type === 'daily_brief');
      if (daily) setBrief(daily.description);
    } catch {}
  };

  useEffect(() => { load(); }, [tab]);

  const runBrief = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/analyze/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId() }),
      });
      const j = await r.json();
      if (j.brief) setBrief(j.brief);
      await load();
    } catch {}
    setLoading(false);
  };

  const setTaskStatus = async (id: string, status: string) => {
    await fetch(`${API}/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {});
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const addNote = async (id: string) => {
    if (!noteText.trim()) return;
    await fetch(`${API}/api/tasks/${id}/note`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shop_id: shopId(), note: noteText.trim() }),
    }).catch(() => {});
    setNoteFor(null);
    setNoteText('');
    load();
  };

  const cols: { key: string; label: string; match: (t: Task) => boolean }[] = [
    { key: 'sales', label: 'Sales', match: (t) => /sale|pos|cashier/i.test(t.type) },
    { key: 'marketing', label: 'Marketing', match: (t) => /marketing|content|whatsapp/i.test(t.type) },
    { key: 'inventory', label: 'Inventory', match: (t) => /invent|stock|reorder/i.test(t.type) },
    { key: 'other', label: 'Other', match: (t) => !/sale|pos|cashier|marketing|content|whatsapp|invent|stock|reorder/i.test(t.type) },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">DAILY BRIEF</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Powered by Llama 3</span>
        </div>
        <button onClick={runBrief} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Running…' : 'Run Daily Brief'}
        </button>
      </div>

      {brief && (
        <div className="bg-neutral-950 border border-emerald-500/20 rounded-2xl p-4 text-sm text-neutral-200 whitespace-pre-wrap">{brief}</div>
      )}

      <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl w-fit">
        {(['active', 'achieved', 'archived'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? 'bg-emerald-500/15 text-emerald-300' : 'text-neutral-400 hover:text-white'}`}>
            {t} ({t === 'active' ? goals.length : '·'})
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {goals.map((g) => {
          const pct = g.target_value > 0 ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
          return (
            <div key={g.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-sm font-bold text-white mb-1">
                <Target className="w-4 h-4 text-emerald-400" /> {g.title}
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden mb-1.5">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[11px] font-mono text-neutral-400">{g.current_value?.toLocaleString()} / {g.target_value?.toLocaleString()} ({pct}%)</div>
              {g.status === 'achieved' && <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Achieved {g.achieved_at ? new Date(g.achieved_at).toLocaleDateString() : ''}</div>}
            </div>
          );
        })}
        {goals.length === 0 && <div className="text-xs text-neutral-500 col-span-full">No {tab} goals. Create one from Goals or AI chat ("Set goal to reach 500k").</div>}
      </div>

      <div>
        <div className="text-xs font-bold text-neutral-300 mb-2">Latest AI insights</div>
        <div className="grid sm:grid-cols-3 gap-3">
          {insights.slice(0, 3).map((i) => (
            <div key={i.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5">
              <div className="text-[10px] font-mono text-purple-300 mb-1">{i.type}</div>
              <div className="text-sm font-bold text-white mb-1">{i.title}</div>
              <div className="text-xs text-neutral-400 line-clamp-4">{i.description}</div>
            </div>
          ))}
          {insights.length === 0 && <div className="text-xs text-neutral-500">No insights yet — run the Daily Brief.</div>}
        </div>
      </div>

      <div>
        <div className="text-xs font-bold text-neutral-300 mb-2">Tasks</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cols.map((c) => (
            <div key={c.key} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3">
              <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide mb-2">{c.label}</div>
              <div className="space-y-2">
                {tasks.filter(c.match).slice(0, 6).map((t) => (
                  <div key={t.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs">
                    <div className="font-semibold text-neutral-200">{t.type}</div>
                    <div className="text-neutral-400 line-clamp-2">{t.ai_notes || t.user_notes}</div>
                    <div className="text-[10px] font-mono text-neutral-500 mt-1">{t.assigned_role} · {t.status}</div>
                    <div className="flex gap-1 mt-1.5">
                      <button onClick={() => setTaskStatus(t.id, 'approved')} className="px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">Approve</button>
                      <button onClick={() => setTaskStatus(t.id, 'done')} className="px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 text-[10px] font-bold flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> Dismiss</button>
                      <button onClick={() => setNoteFor(noteFor === t.id ? null : t.id)} className="px-2 py-0.5 rounded-lg bg-neutral-800 text-neutral-300 text-[10px] font-bold">Add Note</button>
                    </div>
                    {noteFor === t.id && (
                      <div className="flex gap-1 mt-1.5">
                        <input value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="e.g. Customer rude" className="flex-1 bg-neutral-950 border border-neutral-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-emerald-500" />
                        <button onClick={() => addNote(t.id)} className="px-2 py-1 rounded-lg bg-emerald-500 text-neutral-950 text-[10px] font-bold">Save</button>
                      </div>
                    )}
                  </div>
                ))}
                {tasks.filter(c.match).length === 0 && <div className="text-[11px] text-neutral-600 flex items-center gap-1"><Archive className="w-3 h-3" /> Empty</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
