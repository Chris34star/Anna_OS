import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, CheckCircle2, Loader2, MousePointer2, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';

interface ChatMsg {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Auto-typed user reply (typewriter, user watches — no input needed)
const TypedText: React.FC<{ text: string; speed?: number; onDone?: () => void }> = ({
  text,
  speed = 26,
  onDone,
}) => {
  const [count, setCount] = useState(1);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (count >= text.length) {
      doneRef.current?.();
      return;
    }
    const t = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [count, text.length, speed]);
  return (
    <span>
      {text.slice(0, count)}
      {count < text.length && <span className="inline-block w-1.5 h-4 bg-emerald-400 animate-pulse ml-0.5 align-middle" />}
    </span>
  );
};

const BUILD_STEPS = [
  'Creating shop profile',
  'Seeding 40 products & sales history',
  'Analyzing dead stock & VIP customers',
  'Generating your dashboard',
];

export const DemoSetupView: React.FC = () => {
  const { seedDemoData, setActiveTab } = useStore();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [aiTyping, setAiTyping] = useState(false);
  const [typedUserId, setTypedUserId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [phase, setPhase] = useState<'chat' | 'building'>('chat');
  const [buildIdx, setBuildIdx] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number; visible: boolean; clicking: boolean }>({
    x: 0,
    y: 0,
    visible: false,
    clicking: false,
  });
  const approvedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const approveBtnRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, aiTyping, showConfig, buildIdx]);

  const pushAi = async (id: string, text: string) => {
    setAiTyping(true);
    await sleep(1100);
    setAiTyping(false);
    setMessages((p) => [...p, { id, sender: 'ai', text }]);
    await sleep(900);
  };

  const pushUser = async (id: string, text: string) => {
    const msg: ChatMsg = { id, sender: 'user', text };
    setMessages((p) => [...p, msg]);
    setTypedUserId(id);
    // wait for typewriter to finish (approx) + pause
    await sleep(text.length * 26 + 900);
    setTypedUserId(null);
  };

  // Scripted conversational flow — fits the boutique demo, standard length
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await sleep(600);
      if (cancelled) return;
      await pushAi('ai-1', "Hi there! I'm Anna 👋 Your AI store assistant.\n\nI'll build you a live demo shop so you can see exactly what Anna OS does — point of sale, dead-stock alerts, VIP re-engagement and more.\n\nFirst: what kind of shop should we set up?");
      if (cancelled) return;
      await pushUser('u-1', 'A fashion boutique in Nairobi — dresses, heels and handbags.');
      if (cancelled) return;
      await pushAi('ai-2', 'Perfect choice! 👗 Amani Luxe Fashion coming right up.\n\nHow many staff work there, and do you track anything special like sizes or colors?');
      if (cancelled) return;
      await pushUser('u-2', '4 staff — yes, we track sizes and colors for the dresses.');
      if (cancelled) return;
      await pushAi('ai-3', 'Noted! One last thing — roughly how many products? I\'ll generate a sample catalog plus a few months of sales so the dashboard feels real.');
      if (cancelled) return;
      await pushUser('u-3', 'Around 40 products with a few months of sales history.');
      if (cancelled) return;
      await pushAi(
        'ai-4',
        'All set! I\'ve drafted your demo boutique below. 👇\n\nTake a look — if it looks right, approve it and I\'ll create your dashboard and run the full AI analysis.'
      );
      if (!cancelled) setShowConfig(true);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async () => {
    if (approvedRef.current) return;
    approvedRef.current = true;
    setCursor((c) => ({ ...c, visible: false }));
    setPhase('building');
    const seeding = seedDemoData();
    for (let i = 0; i < BUILD_STEPS.length; i++) {
      setBuildIdx(i);
      await sleep(1200);
    }
    setBuildIdx(BUILD_STEPS.length);
    await seeding;
    // Go to Analyzer BLANK — user must click "Run AI Analysis" to fill tasks/insights/goals.
    setActiveTab('analyzer');
    await sleep(400);
  };

  // Animated mouse: glides to the Approve button and clicks it
  useEffect(() => {
    if (!showConfig || phase !== 'chat') return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        const card = cardRef.current;
        const btn = approveBtnRef.current;
        if (!card || !btn) {
          handleApprove();
          return;
        }
        const cr = card.getBoundingClientRect();
        const br = btn.getBoundingClientRect();
        // start bottom-right of card, glide to button center
        setCursor({
          x: br.left - cr.left + br.width / 2,
          y: br.top - cr.top + br.height / 2,
          visible: true,
          clicking: false,
        });
        // place initially offset, then glide (two-step for visible motion)
        setCursor({
          x: cr.width - 40,
          y: cr.height + 60,
          visible: true,
          clicking: false,
        });
        timers.push(
          setTimeout(() => {
            setCursor({
              x: br.left - cr.left + br.width / 2,
              y: br.top - cr.top + br.height / 2,
              visible: true,
              clicking: false,
            });
          }, 150)
        );
        timers.push(
          setTimeout(() => {
            setCursor((c) => ({ ...c, clicking: true }));
          }, 1600)
        );
        timers.push(
          setTimeout(() => {
            handleApprove();
          }, 2100)
        );
      }, 2200)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showConfig, phase]);

  const handleSkip = async () => {
    if (!showConfig) {
      setShowConfig(true);
    } else {
      await handleApprove();
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-neutral-100 font-sans flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-neutral-800/80 bg-[#090b10]/90 px-4 sm:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-mono font-black text-white text-[10px]">
            AO
          </div>
          <div>
            <div className="text-xs font-extrabold text-white">ANNA OS · Interactive Demo Setup</div>
            <div className="text-[10px] font-mono text-neutral-500">Watch Anna build your demo boutique live</div>
          </div>
        </div>
        {phase === 'chat' && (
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            Skip intro <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-40">
          {messages.map((m) =>
            m.sender === 'ai' ? (
              <div key={m.id} className="flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tl-md bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 whitespace-pre-line leading-relaxed">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-tr-md bg-emerald-600 text-white text-sm font-medium leading-relaxed">
                  {typedUserId === m.id ? <TypedText text={m.text} /> : m.text}
                </div>
              </div>
            )
          )}

          {aiTyping && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-neutral-900 border border-neutral-800 flex gap-1">
                {[0, 1, 2].map((d) => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Draft config card + approve */}
          {showConfig && phase === 'chat' && (
            <div
              ref={cardRef}
              className="relative ml-9 p-5 rounded-2xl bg-neutral-900/80 border border-emerald-500/30 shadow-xl shadow-emerald-950/40 space-y-3 animate-in zoom-in-95 duration-300"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Draft demo boutique — review & approve
              </div>
              <div className="text-base font-extrabold text-white">Amani Luxe Fashion & Footwear</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-neutral-500 font-mono text-[10px]">TYPE</div>
                  <div className="font-bold text-white">Fashion Boutique</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-neutral-500 font-mono text-[10px]">STAFF</div>
                  <div className="font-bold text-white">4 roles (CEO, Cashier…)</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-neutral-500 font-mono text-[10px]">TRACKS</div>
                  <div className="font-bold text-white">Size · Color · Material</div>
                </div>
                <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-neutral-500 font-mono text-[10px]">CATALOG</div>
                  <div className="font-bold text-white">40 products + sales</div>
                </div>
              </div>
              <button
                ref={approveBtnRef}
                onClick={handleApprove}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                Approve & Build My Demo ✓
              </button>

              {/* Fake auto-click mouse */}
              {cursor.visible && (
                <div
                  className="absolute z-10 pointer-events-none transition-all duration-[1400ms] ease-in-out"
                  style={{ left: cursor.x, top: cursor.y }}
                >
                  <MousePointer2
                    className={`w-6 h-6 text-white drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] transition-transform duration-150 ${
                      cursor.clicking ? 'scale-75' : 'scale-100'
                    }`}
                    fill="currentColor"
                  />
                  {cursor.clicking && (
                    <span className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Building animation */}
          {phase === 'building' && (
            <div className="ml-9 p-5 rounded-2xl bg-neutral-900/80 border border-emerald-500/30 space-y-4 animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                Creating & analyzing your demo shop…
              </div>
              <div className="space-y-2.5">
                {BUILD_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-2.5 text-xs">
                    {i < buildIdx || buildIdx >= BUILD_STEPS.length ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : i === buildIdx ? (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-700 shrink-0" />
                    )}
                    <span className={i <= buildIdx ? 'text-neutral-200 font-semibold' : 'text-neutral-500'}>
                      {step}
                      {i === buildIdx && buildIdx < BUILD_STEPS.length ? '…' : ''}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (buildIdx / BUILD_STEPS.length) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Locked input — demo setup runs itself */}
      <div className="shrink-0 border-t border-neutral-800/80 bg-[#090b10]/95 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2 px-4 py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-500">
          <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Sit back — Anna is running this demo setup herself. No typing needed.</span>
        </div>
      </div>
    </div>
  );
};
