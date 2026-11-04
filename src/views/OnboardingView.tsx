import React, { useState } from 'react';
import {
  Bot,
  Check,
  Layers,
  Package,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { NavApproval } from '../components/Wiring';
import { OnboardingExtractionResult, extractOnboardingDetails } from '../lib/llama';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  extractionResult?: OnboardingExtractionResult;
}

export const OnboardingView: React.FC = () => {
  const { shop, setShop, setActiveTab, authUser } = useStore();

  const ownerName = authUser?.name || 'there';
  const ownerEmail = authUser?.email || '';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-01',
      sender: 'ai',
      text: `Habari ${ownerName.split(' ')[0]}! 👋 I am Anna, your live AI setup agent.\n\nTell me about your real business and I'll build your workspace — no demo data, blank home until you run analysis.\n\n1. What kind of business do you run and what do you sell?\n2. How many staff work with you?\n3. Anything special to track (sizes/colors, warranty, expiry dates, appointments)?`,
      timestamp: 'Just now',
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeConfig, setActiveConfig] = useState<OnboardingExtractionResult | null>(null);

  const samplePrompts = [
    '👗 Fashion & footwear boutique in Nairobi, 4 staff, dresses, heels, handbags',
    '📱 Electronics & smartphone shop, 3 staff, phones, laptops, TVs and repair',
    '🛒 Mini-mart & retail grocery, 5 staff, milk, bread, household FMCG',
    '✂️ Salon, barbershop & beauty spa, 4 stylists, braids, nails, facials',
    '🔨 Hardware supplies & building materials, 3 staff, cement, paint, pipes',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsProcessing(true);

    try {
      const result = await extractOnboardingDetails(text);
      const usedAI = Boolean(localStorage.getItem('anna_ai_api_key')) || Boolean((import.meta as any).env?.VITE_AI_BASE_URL);
      setActiveConfig(result);

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: `Done — I set up your ${result.shop_type.replace('_', ' ')} workspace: **${result.shop_name}**.\n• Staff Roles: ${result.suggested_roles.join(', ')}\n• Tracking: ${result.custom_fields_needed.join(', ')}\n\nConfirm below and I'll open your EMPTY home — tasks, goals and insights appear only after you click "Run AI Analysis".${usedAI ? '' : '\n\n(Tip: add your AI key in Settings → Model for full live-AI responses.)'}`,
        timestamp: 'Just now',
        extractionResult: result,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Fallback
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyConfig = async () => {
    if (activeConfig) {
      setShop({
        ...shop,
        name: activeConfig.shop_name,
        type: activeConfig.shop_type,
        staff_count: activeConfig.staff_count,
        suggested_roles: activeConfig.suggested_roles,
        custom_fields_needed: activeConfig.custom_fields_needed,
      });
      // Save onboarding Q&A to knowledge_base + create shop server-side (nav approval next)
      try {
        const API = (import.meta as any).env?.VITE_API_BASE || '';
        const qna = messages.map((m) => `${m.sender === 'ai' ? 'AI' : 'Owner'}: ${m.text}`).join('\n');
        const sid = localStorage.getItem('anna_shop_id') || shop.id || 'demo-shop';
        await fetch(`${API}/api/onboarding/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shop_id: sid, notes: `Business: ${activeConfig.shop_name} (${activeConfig.shop_type}), staff ${activeConfig.staff_count}. Q&A:\n${qna}`.slice(0, 3000) }),
        }).catch(() => {});
        const r = await fetch(`${API}/api/shop/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: qna.slice(0, 2000), shop_name: activeConfig.shop_name }),
        }).catch(() => null);
        const j = await r?.json().catch(() => null);
        if (j?.shop?.id) {
          localStorage.setItem('anna_shop_id', j.shop.id);
          (window as any).__annaNavs = j.navs || [];
        }
      } catch {}
    }
    // Real AI flow: AI configured the shop from chat → land on Analyzer BLANK.
    // User must click "Run AI Analysis" to populate tasks/insights/goals.
    // AI opens an EMPTY home and builds the business environment — never demo.
    setActiveTab('analyzer');
  };

  const handleLaunchWithRealWorkspace = async () => {
    setActiveTab('analyzer');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Real Store Setup &amp; Onboarding
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
              Llama 3 Commerce Agent
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {activeConfig ? `Welcome to ${activeConfig.shop_name}` : 'Set up your real store with AI'}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Signed in as Store Owner: <strong className="text-emerald-400">{ownerName}</strong>{ownerEmail ? ` (${ownerEmail})` : ''}
          </p>
        </div>

        <button
          onClick={handleLaunchWithRealWorkspace}
          className="px-4 py-2 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <span>Open Empty Workspace →</span>
        </button>
      </div>

      {/* Real Store Setup — AI chat configures everything (no demo data path) */}
      <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Business Setup</h3>
            <p className="text-[11px] text-neutral-500 font-mono">Chat below — Anna configures your real store</p>
          </div>
        </div>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Describe your business in the chat (type, products, staff). Anna connects to real AI, sets up your workspace, then opens a blank home — tasks and insights appear only after you run analysis.
        </p>
        <button
          onClick={handleApplyConfig}
          disabled={!activeConfig}
          className="w-full py-2.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{activeConfig ? 'Confirm Setup & Enter Workspace' : 'Chat first, then confirm setup'}</span>
        </button>
      </div>

      {/* Main Conversational Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat UI */}
        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
          {/* Top Bar */}
          <div className="p-3.5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-200 block">Anna Setup Agent</span>
                <span className="text-[10px] text-neutral-500 font-mono">live AI · {(import.meta as any).env?.VITE_AI_MODEL || 'meta-musepark-1.3'}</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Real AI Setup</span>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {m.extractionResult && (
                    <div className="mt-2.5 pt-2.5 border-t border-neutral-800/80 space-y-2">
                      <div className="text-[10px] font-mono text-purple-300 font-semibold uppercase tracking-wider">
                        Extracted Boutique Schema
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                          <span className="text-neutral-500 block">Shop Type:</span>
                          <span className="font-bold text-emerald-400 capitalize">
                            {m.extractionResult.shop_type}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                          <span className="text-neutral-500 block">Staff Members:</span>
                          <span className="font-mono font-bold text-white">
                            {m.extractionResult.staff_count} Staff
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-[9px] block text-right ${
                      m.sender === 'user' ? 'text-emerald-200/80' : 'text-neutral-500'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-2 items-center text-xs text-neutral-400">
                <Bot className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Anna AI is analyzing your business...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-3.5 py-1.5 bg-neutral-950/80 border-t border-neutral-800/60 overflow-x-auto flex gap-1.5 text-[11px]">
            <span className="text-neutral-500 shrink-0 self-center">Try prompt:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                disabled={isProcessing}
                className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors shrink-0 whitespace-nowrap"
              >
                &ldquo;{p.slice(0, 32)}...&rdquo;
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex gap-2">
            <input
              type="text"
              placeholder="e.g. Luxury fashion & footwear boutique, 4 staff, dresses, heels, bags"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isProcessing}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isProcessing || !inputVal.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Right Preview */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-neutral-100">Store Preview (AI-built)</h3>
            </div>
            {!activeConfig && (
              <div className="text-[11px] text-neutral-500">Empty until you chat — AI fills this from your answers.</div>
            )}

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs">
              <div>
                <span className="text-[10px] text-neutral-500 block">STORE NAME</span>
                <span className="font-semibold text-neutral-200">
                  {activeConfig?.shop_name || '— chat first, AI will set this —'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block">INDUSTRY BLUEPRINT</span>
                <span className="font-bold text-emerald-400 uppercase tracking-wider">
                  {activeConfig?.shop_type || '— pending AI setup —'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block mb-1">SUGGESTED ROLES</span>
                <div className="flex flex-wrap gap-1">
                  {(activeConfig?.suggested_roles || shop.suggested_roles || []).length ? (
                    (activeConfig?.suggested_roles || shop.suggested_roles || []).map(
                      (role) => (
                        <span
                          key={role}
                          className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-300 font-medium"
                        >
                          {role}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-[10px] text-neutral-600">— AI will configure after chat —</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 block mb-1">TRACKING FIELDS</span>
                <div className="flex flex-wrap gap-1">
                  {(activeConfig?.custom_fields_needed || shop.custom_fields_needed || []).length ? (
                    (activeConfig?.custom_fields_needed || shop.custom_fields_needed || []).map(
                      (field) => (
                        <span
                          key={field}
                          className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/40 text-[10px] text-purple-300 font-mono"
                        >
                          {field}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-[10px] text-neutral-600">— AI will configure after chat —</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800/60 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Unified Postgres Database
              </span>
              <p className="text-[10px] text-neutral-500 leading-normal">
                Single schema design powering Multi-Item POS, Llama 3 Analyzer, Action Wall, and Meta WhatsApp Cloud API.
              </p>
            </div>
          </div>

          <button
            onClick={handleApplyConfig}
            className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl transition-all shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Save Shop &amp; Open POS Register</span>
          </button>
          {(window as any).__annaNavs?.length ? (
            <NavApproval navs={(window as any).__annaNavs} onDone={() => { (window as any).__annaNavs = []; }} />
          ) : null}
        </div>
      </div>
    </div>
  );
};
