import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  CheckCircle2,
  Cpu,
  Layers,
  MessageSquare,
  Play,
  Send,
  Sparkles,
  Store,
  User,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { OnboardingExtractionResult, extractOnboardingDetails } from '../lib/llama';
import { ShopContextAnswers } from '../types';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  mode?: 'onboarding' | 'analyzer_context' | 'general';
  extractionResult?: OnboardingExtractionResult;
  contextSaved?: boolean;
}

export const ChatView: React.FC = () => {
  const {
    shop,
    setShop,
    setActiveTab,
    goals,
    addGoal,
    chatInitialPrompt,
    setChatInitialPrompt,
    saveShopContext,
    runAnalysis,
    unreadAssistantCount,
    clearUnreadAssistantCount,
  } = useStore();

  const [hasPendingQuestion, setHasPendingQuestion] = useState(unreadAssistantCount > 0);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'msg-01',
        sender: 'ai',
        text: 'Habari! I am Anna, your autonomous retail operating system. You can setup your store, set strategic goals, review achieved milestones, or provide real-time marketing feedback to train the business analyzer.',
        timestamp: 'Just now',
        mode: 'general',
      },
    ];
  });

  const [inputVal, setInputVal] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [contextExtracted, setContextExtracted] = useState<ShopContextAnswers | null>(null);

  // Auto-trigger prompt if redirected from Analyzer or Goals
  useEffect(() => {
    if (chatInitialPrompt) {
      if (chatInitialPrompt.toLowerCase().includes('analyzer questions')) {
        handleTriggerAnalyzerQuestions();
      } else {
        handleSendMessage(chatInitialPrompt);
      }
      setChatInitialPrompt(undefined);
    }
  }, [chatInitialPrompt]);

  const handleTriggerAnalyzerQuestions = () => {
    const userPromptMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: 'Ask me the analyzer questions before analyzing.',
      timestamp: 'Just now',
    };

    const aiQuestionsMsg: ChatMessage = {
      id: `msg-ai-${Date.now() + 1}`,
      sender: 'ai',
      text: `Anna OS Pre-Analysis Check:
To sharpen marketing conversion and dead stock clearance recommendations:

1. Response for last messages: What was the customer reply rate to your last WhatsApp/SMS broadcast?
2. Content posted & reach: Did you post social reels or WhatsApp status updates this week? How many views & walk-in conversions?
3. Buyer feedback: What are walk-in customers currently bargaining for at the counter?`,
      timestamp: 'Just now',
      mode: 'analyzer_context',
    };

    setMessages((prev) => [...prev, userPromptMsg, aiQuestionsMsg]);
  };

  const quickContextReplies = [
    '🎯 Check my active goals and progress',
    '⚡ Set goal: Clear 18 Chiffon Dresses by Friday',
    'Low WhatsApp response · 1.4k TikTok views · Customers asking for dress & heel bundle discounts',
    '🏆 Show achieved goals & unlocked capital',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isProcessing) return;

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
      // Check if user is asking to be asked questions
      if (text.toLowerCase().includes('ask me the analyzer questions') || text.toLowerCase().includes('analyzer question')) {
        handleTriggerAnalyzerQuestions();
        setIsProcessing(false);
        return;
      }

      // Check if user is asking about Goals or Milestones
      if (
        text.toLowerCase().includes('goal') ||
        text.toLowerCase().includes('milestone') ||
        text.toLowerCase().includes('target')
      ) {
        const active = goals.filter((g) => g.status === 'active');
        const achieved = goals.filter((g) => g.status === 'achieved');

        if (text.toLowerCase().includes('set goal') || text.toLowerCase().includes('new goal')) {
          const newG = addGoal({
            title: text.replace(/set goal:?/i, '').trim() || 'Clear Stagnant Inventory',
            category: 'clearance',
            target_value: 12,
            current_value: 0,
            unit: 'units',
            deadline: 'This Friday',
            status: 'active',
            ai_note: 'Target added via Anna Chat. Live POS auto-sync active.',
          });

          const aiMsg: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'ai',
            text: `🎯 Target Established: "${newG.title}"
• Category: Dead Stock Clearance
• Quota: ${newG.target_value} units (Deadline: ${newG.deadline})
• Auto-Sync: Every POS checkout will count towards this milestone.

Visit the Goals tab to track live progress and unlock working capital!`,
            timestamp: 'Just now',
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsProcessing(false);
          return;
        }

        const activeList = active
          .map(
            (g) =>
              `• ${g.title}: ${g.current_value}/${g.target_value} ${g.unit} (${Math.round(
                (g.current_value / g.target_value) * 100
              )}%) [${g.deadline || 'This Week'}]`
          )
          .join('\n');

        const achievedList = achieved
          .map((g) => `• ✓ ${g.title} (${g.achieved_at || 'Archived'})`)
          .join('\n');

        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `📊 Anna OS Goals Intelligence Brief:

Active Targets (${active.length}):
${activeList || 'None currently active.'}

Achieved Hall of Fame (${achieved.length}):
${achievedList || 'No achieved goals yet.'}

Tip: Every POS transaction automatically increments matching goals. When 100% is reached, Anna OS celebrates and logs the unlocked working capital.`,
          timestamp: 'Just now',
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsProcessing(false);
        return;
      }

      // Check if user provided marketing/campaign context answers
      const isContextAnswer =
        text.toLowerCase().includes('whatsapp') ||
        text.toLowerCase().includes('views') ||
        text.toLowerCase().includes('response') ||
        text.toLowerCase().includes('tiktok') ||
        text.toLowerCase().includes('walk-in') ||
        text.toLowerCase().includes('replies') ||
        text.toLowerCase().includes('instagram');

      if (isContextAnswer) {
        const answers: ShopContextAnswers = {
          last_campaign_feedback: text,
          social_reach_views: text.includes('views') ? text : '1,200 views',
          foot_traffic_observation: text.includes('walk-in') ? text : 'High bargain demand on evening dresses and stiletto heels',
        };

        saveShopContext(answers);
        setContextExtracted(answers);

        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Context recorded and synchronized! 
• Campaign Response: "${answers.last_campaign_feedback}"
• Marketing Reach: Factored into Llama 3 conversion engine.

Ready to run analysis with these fresh ground-truth inputs.`,
          timestamp: 'Just now',
          contextSaved: true,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        // Run standard store onboarding extraction
        const result = await extractOnboardingDetails(text);
        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'ai',
          text: `Configured store template: **${result.shop_type.toUpperCase()}** (${result.staff_count} staff). Roles: ${result.suggested_roles.join(', ')}.`,
          timestamp: 'Just now',
          extractionResult: result,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLaunchAnalysisWithContext = async () => {
    // Go to Analyzer BLANK — user clicks "Run AI Analysis" to populate.
    setActiveTab('analyzer');
    setIsProcessing(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Anna Assistant &amp; Strategic Q&amp;A
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Llama 3 Interactive Agent · Onboarding &amp; Marketing Context
          </p>
        </div>

        <button
          onClick={handleTriggerAnalyzerQuestions}
          className="px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 rounded-xl hover:bg-purple-900/60 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Ask Me Analyzer Questions</span>
        </button>
      </div>

      {/* Pending Strategic Improvement Banner (triggered by unread badge) */}
      {hasPendingQuestion && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 via-purple-950/40 to-neutral-900 border border-rose-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-widest">
                Anna AI Urgent Improvement Recommendation
              </span>
            </div>
            <p className="text-xs font-semibold text-neutral-100">
              18 units of Pleated Chiffon Floral Maxi Dress have been idle for 48 days. Should we fire an automated 15% WhatsApp broadcast drop to 30 past boutique shoppers?
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setHasPendingQuestion(false);
                clearUnreadAssistantCount();
                setActiveTab('analyzer');
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-950 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Review in Analyzer →</span>
            </button>
            <button
              onClick={() => {
                setHasPendingQuestion(false);
                clearUnreadAssistantCount();
              }}
              className="px-2.5 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Box */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[580px] shadow-xl">
        {/* Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2.5 ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-xs'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-line">{m.text}</p>

                {m.contextSaved && (
                  <div className="pt-2">
                    <button
                      onClick={handleLaunchAnalysisWithContext}
                      className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-2 cursor-pointer"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>Run AI Analysis with this Context →</span>
                    </button>
                  </div>
                )}

                {m.extractionResult && (
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-emerald-400">
                      Template: {m.extractionResult.shop_type.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setActiveTab('pos')}
                      className="text-emerald-400 font-bold underline hover:text-white"
                    >
                      Open POS →
                    </button>
                  </div>
                )}

                <span
                  className={`text-[10px] block text-right ${
                    m.sender === 'user' ? 'text-emerald-200/80' : 'text-neutral-500'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-2 items-center text-xs text-neutral-400">
              <Bot className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Anna is reasoning...</span>
            </div>
          )}
        </div>

        {/* Quick Context Chips */}
        <div className="px-4 py-2 bg-neutral-950/80 border-t border-neutral-800 flex gap-2 overflow-x-auto text-[11px]">
          <span className="text-neutral-500 shrink-0 self-center">1-Click Feedback:</span>
          {quickContextReplies.map((reply, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(reply)}
              disabled={isProcessing}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {reply.slice(0, 36)}...
            </button>
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex gap-2">
          <input
            type="text"
            placeholder="Type your response or 'Ask me the analyzer questions'..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isProcessing}
            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isProcessing || !inputVal.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
