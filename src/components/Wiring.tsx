import React, { useState } from 'react';
import { CheckSquare, Download, RefreshCw, Sparkles, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

const API = (import.meta as any).env?.VITE_API_BASE || '';
const shopId = () => localStorage.getItem('anna_shop_id') || 'demo-shop';

/** Onboarding approval: nav checkboxes (is_approved) after AI questions. */
export const NavApproval: React.FC<{ navs: any[]; onDone: () => void }> = ({ navs, onDone }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>(
    Object.fromEntries(navs.map((n) => [n.id, n.is_fixed ? true : Boolean(n.is_approved)]))
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    for (const n of navs) {
      if (n.is_fixed) continue;
      await fetch(`${API}/api/shop/navs/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: Boolean(checked[n.id]) }),
      }).catch(() => {});
    }
    setSaving(false);
    onDone();
  };

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
      <div className="text-sm font-bold text-white">Approve your navigation</div>
      <div className="text-xs text-neutral-400">Fixed navs are always on. Tick the rest to enable them.</div>
      {navs.map((n) => (
        <label key={n.id} className="flex items-center gap-2 text-sm text-neutral-200 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2">
          <input
            type="checkbox"
            checked={n.is_fixed ? true : Boolean(checked[n.id])}
            disabled={n.is_fixed}
            onChange={(e) => setChecked((c) => ({ ...c, [n.id]: e.target.checked }))}
            className="accent-emerald-500"
          />
          <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          {n.label}
          {n.is_fixed && <span className="text-[10px] font-mono text-neutral-500 ml-auto">FIXED</span>}
        </label>
      ))}
      <button onClick={save} disabled={saving} className="w-full py-2 rounded-xl bg-emerald-500 text-neutral-950 text-sm font-bold hover:bg-emerald-400 disabled:opacity-50">
        {saving ? 'Saving…' : 'Save navigation'}
      </button>
    </div>
  );
};

/** Import extras: Use Demo Data seeder (60 products / 120 customers / 300 sales / 5 KB docs). */
export const DemoSeeder: React.FC = () => {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const seed = async () => {
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/seed/demo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId() }),
      });
      const j = await r.json();
      setDone(`Seeded ${j.products} products · ${j.customers} customers · ${j.sales} sales · ${j.kb_docs} KB docs`);
    } catch (e) {
      setDone(`Failed: ${String((e as Error).message)}`);
    }
    setBusy(false);
  };
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 space-y-2">
      <div className="text-sm font-bold text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-emerald-400" /> Use Demo Data</div>
      <div className="text-xs text-neutral-400">60 products · 120 customers (ratings 1–10) · 300 sales · 5 knowledge docs</div>
      <button onClick={seed} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold hover:bg-emerald-400 disabled:opacity-50">
        <Download className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} /> {busy ? 'Seeding…' : 'Seed demo data'}
      </button>
      {done && <div className="text-xs text-emerald-300">{done}</div>}
    </div>
  );
};

/** Excel upload (xlsx) — parses first sheet to JSON preview, hands rows to existing import flow. */
export const ExcelUpload: React.FC<{ onRows: (rows: any[]) => void }> = ({ onRows }) => {
  const [fileName, setFileName] = useState('');
  const pick = async (f: File) => {
    setFileName(f.name);
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf);
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    onRows(rows);
  };
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-800 text-white text-xs font-bold hover:bg-neutral-700 cursor-pointer">
      <Upload className="w-3.5 h-3.5" /> {fileName || 'Upload Excel (.xlsx)'}
      <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
    </label>
  );
};

export const RefreshIcon = RefreshCw;
