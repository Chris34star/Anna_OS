import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Coins,
  FileCheck,
  HelpCircle,
  MessageSquare,
  PackageX,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserX,
  X,
} from 'lucide-react';
import { BusinessInsight, RoleName } from '../types';
import { useStore } from '../lib/store';
import { WhatsAppModal } from '../components/WhatsAppModal';

export const AnalyzerView: React.FC = () => {
  const {
    insights,
    isAnalyzing,
    runAnalysis,
    addTask,
    updateInsightStatus,
    products,
    customers,
    shopContext,
    goals,
    setActiveTab,
    setChatInitialPrompt,
  } = useStore();

  const [activeWhatsAppInsight, setActiveWhatsAppInsight] = useState<BusinessInsight | null>(null);
  const [taskModalInsight, setTaskModalInsight] = useState<BusinessInsight | null>(null);
  const [assignedRole, setAssignedRole] = useState<RoleName>('Floor Cashier');
  const [taskNote, setTaskNote] = useState('');
  const [showPreAnalysisModal, setShowPreAnalysisModal] = useState(false);

  // Trigger Pre-Analysis Check or Direct Analysis
  const handleAnalysisClick = () => {
    // If context not yet answered, prompt user
    if (!shopContext.last_campaign_feedback) {
      setShowPreAnalysisModal(true);
    } else {
      executeAnalysis();
    }
  };

  const executeAnalysis = async () => {
    setShowPreAnalysisModal(false);
    await runAnalysis();
  };

  const handleRedirectToChatQuestions = () => {
    setShowPreAnalysisModal(false);
    setChatInitialPrompt('Ask me the analyzer questions');
    setActiveTab('chat');
  };

  const handleApproveAsTask = (insight: BusinessInsight) => {
    setTaskModalInsight(insight);
    setTaskNote(`Follow up on: ${insight.title}. ${insight.suggested_action}`);
    setAssignedRole(insight.type === 'dead_stock' ? 'Stock Manager' : insight.type === 'sales_strategy' ? 'Boutique Stylist' : 'Floor Cashier');
  };

  const handleConfirmTask = () => {
    if (!taskModalInsight) return;
    addTask({
      assigned_role: assignedRole,
      title: taskModalInsight.title,
      description: taskNote,
      status: 'approved',
      ai_suggestion: {
        insight_type: taskModalInsight.type,
        source: 'Anna OS Intelligence Brief',
        potential_impact_kes: taskModalInsight.estimated_recovery_kes,
      },
    });
    updateInsightStatus(taskModalInsight.id, 'approved_task');
    setTaskModalInsight(null);
  };

  const handleDismiss = (insightId: string) => {
    updateInsightStatus(insightId, 'dismissed');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Anna OS · Llama 3 Analyzer
            </span>
            {shopContext.last_campaign_feedback && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60 text-emerald-300">
                Context Enriched
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Daily Intelligence Brief
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setChatInitialPrompt('Ask me the analyzer questions');
              setActiveTab('chat');
            }}
            className="px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/60 border border-purple-800/40 rounded-xl hover:bg-purple-900/60 transition-colors flex items-center gap-1.5"
            title="Refine recent marketing & campaign signals in chat"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Pre-Analysis Q&amp;A</span>
          </button>

          <button
            onClick={handleAnalysisClick}
            disabled={isAnalyzing}
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50 rounded-xl transition-all shadow-lg shadow-emerald-700/20 flex items-center gap-2 cursor-pointer"
          >
            <BrainCircuit className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing Store...' : 'Run AI Analysis'}</span>
          </button>
        </div>
      </div>

      {/* KPI Value Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-neutral-400">Dead Stock Value</span>
            <div className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              KES 81,000
            </div>
            <span className="text-[10px] text-neutral-500">18 Chiffon Maxi Dresses &gt;45d</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <PackageX className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-neutral-400">At-Risk VIP Fashion Revenue</span>
            <div className="text-xl font-bold font-mono text-rose-400 tabular-nums">
              KES 580,000
            </div>
            <span className="text-[10px] text-neutral-500">8 VIP fashionistas inactive &gt;32d</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] text-neutral-400">Cross-Sell Opportunity</span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              KES 95,000
            </div>
            <span className="text-[10px] text-neutral-500">4x Handbag &amp; Stiletto bundles</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Strategic Goals In Play Banner */}
      {goals.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-950 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-400" /> ACTIVE STRATEGIC TARGETS
              </span>
              <span className="text-xs text-neutral-400">
                AI cross-references these targets when ranking daily action priority
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5 text-xs font-mono">
              {goals
                .filter((g) => g.status === 'active')
                .slice(0, 3)
                .map((g) => (
                  <span
                    key={g.id}
                    className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-200 flex items-center gap-1.5"
                  >
                    <span className="text-emerald-400 font-bold">●</span>
                    <span className="font-semibold text-white">{g.title}:</span>
                    <span className="text-neutral-400">
                      {g.current_value}/{g.target_value} {g.unit}
                    </span>
                  </span>
                ))}
              {goals.some((g) => g.status === 'achieved') && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>{goals.filter((g) => g.status === 'achieved').length} Won Milestones</span>
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('goals')}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-800/40 rounded-xl transition-all flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <span>Manage Goals →</span>
          </button>
        </div>
      )}

      {/* Main Analysis Display */}
      {insights.length === 0 ? (
        <div className="py-14 px-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 mx-auto flex items-center justify-center text-emerald-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-neutral-100">Ready for Anna OS Briefing</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Click &quot;Run AI Analysis&quot; to scan live inventory, customer cadence, and recent sales. Tasks will be populated directly into the Action Wall.
          </p>
          <button
            onClick={handleAnalysisClick}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-700/20 inline-flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate Today&apos;s 3 Insights</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Strategic Insights ({insights.length})
            </h3>
            <span className="text-[11px] text-neutral-500 font-mono">
              Action Wall updated with 3 tasks
            </span>
          </div>

          {/* 3 Tight Insight Cards */}
          <div className="grid grid-cols-1 gap-4">
            {insights.map((insight, idx) => {
              const isApprovedWhatsApp = insight.status === 'approved_whatsapp';
              const isApprovedTask = insight.status === 'approved_task';
              const isDismissed = insight.status === 'dismissed';

              return (
                <div
                  key={insight.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isDismissed
                      ? 'bg-neutral-950/40 border-neutral-800/40 opacity-40'
                      : isApprovedWhatsApp
                      ? 'bg-emerald-950/20 border-emerald-800/40 shadow-xs'
                      : isApprovedTask
                      ? 'bg-purple-950/20 border-purple-800/40 shadow-xs'
                      : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          0{idx + 1}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            insight.type === 'dead_stock'
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                              : insight.type === 'vip_churn'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/40'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          }`}
                        >
                          {insight.badge_label}
                        </span>

                        {isApprovedWhatsApp && (
                          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Dispatched via WhatsApp
                          </span>
                        )}

                        {isApprovedTask && (
                          <span className="text-[11px] font-medium text-purple-300 flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" /> Assigned to Action Wall
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white tracking-tight">
                        {insight.title}
                      </h4>

                      <p className="text-xs text-neutral-300 leading-relaxed max-w-3xl">
                        {insight.description}
                      </p>

                      <div className="flex items-center gap-3 pt-1 text-xs text-neutral-400 font-mono">
                        <span className="text-emerald-400 font-bold">
                          KES {insight.estimated_recovery_kes?.toLocaleString()} Recovery
                        </span>
                        <span className="text-neutral-700">·</span>
                        <span className="text-neutral-400">{insight.suggested_action}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                      <button
                        onClick={() => setActiveWhatsAppInsight(insight)}
                        disabled={isDismissed}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleApproveAsTask(insight)}
                        disabled={isDismissed}
                        className="px-3 py-2 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span>Assign Task</span>
                      </button>

                      <button
                        onClick={() => handleDismiss(insight.id)}
                        disabled={isDismissed}
                        className="p-2 text-neutral-500 hover:text-rose-400 transition-colors"
                        title="Dismiss"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pre-Analysis Clarification Modal */}
      {showPreAnalysisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-sm text-neutral-100">Anna OS Pre-Analysis Check</h3>
              </div>
              <button
                onClick={() => setShowPreAnalysisModal(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Anna AI can factor in recent campaign performance before analyzing:
            </p>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1 text-xs text-neutral-400">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Response rate to your last WhatsApp / SMS broadcast</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Social views (TikTok / Instagram reels) &amp; walk-in conversions</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>Dead stock brands you wish to prioritize for clearance</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleRedirectToChatQuestions}
                className="w-full py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Answer Questions in Chat (Recommended) →</span>
              </button>

              <button
                onClick={executeAnalysis}
                className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors cursor-pointer"
              >
                Run Quick Analysis (Database Only)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {activeWhatsAppInsight && (
        <WhatsAppModal
          insight={activeWhatsAppInsight}
          onClose={() => setActiveWhatsAppInsight(null)}
        />
      )}

      {/* Task Assignment Modal */}
      {taskModalInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-purple-400" /> Assign Store Directive
              </h3>
              <button
                onClick={() => setTaskModalInsight(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Assign To Role
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value as RoleName)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200"
              >
                <option value="Floor Cashier">Floor Cashier</option>
                <option value="Boutique Stylist">Boutique Stylist</option>
                <option value="Stock Manager">Stock Manager</option>
                <option value="CEO">CEO</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Instructions
              </label>
              <textarea
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTaskModalInsight(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTask}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl"
              >
                Post to Action Wall
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
