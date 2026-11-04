import React, { useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  Flame,
  Layers,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Goal, GoalCategory } from '../types';

export const GoalsView: React.FC = () => {
  const {
    goals,
    addGoal,
    updateGoalProgress,
    markGoalAchieved,
    deleteGoal,
    shop,
    setActiveTab,
    setChatInitialPrompt,
  } = useStore();

  const [activeTabFilter, setActiveTabFilter] = useState<'active' | 'achieved'>('active');
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);

  // Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('revenue');
  const [targetValue, setTargetValue] = useState<number>(500000);
  const [goalUnit, setGoalUnit] = useState<'KES' | 'units' | 'customers'>('KES');
  const [deadline, setDeadline] = useState('This Friday');
  const [aiNote, setAiNote] = useState('');

  const activeGoals = goals.filter((g) => g.status === 'active');
  const achievedGoals = goals.filter((g) => g.status === 'achieved');

  // Metrics
  const totalTargetKes = activeGoals
    .filter((g) => g.unit === 'KES')
    .reduce((sum, g) => sum + g.target_value, 0);
  const currentProgressKes = activeGoals
    .filter((g) => g.unit === 'KES')
    .reduce((sum, g) => sum + g.current_value, 0);

  const totalCapitalUnlocked = achievedGoals
    .filter((g) => g.unit === 'KES')
    .reduce((sum, g) => sum + g.target_value, 0);

  const overallActiveCompletion =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, g) => sum + Math.min(100, (g.current_value / g.target_value) * 100), 0) /
            activeGoals.length
        )
      : 0;

  const handleSelectTemplate = (
    title: string,
    category: GoalCategory,
    target: number,
    unit: 'KES' | 'units' | 'customers',
    dl: string,
    note: string
  ) => {
    setGoalTitle(title);
    setGoalCategory(category);
    setTargetValue(target);
    setGoalUnit(unit);
    setDeadline(dl);
    setAiNote(note);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    addGoal({
      title: goalTitle,
      category: goalCategory,
      target_value: Number(targetValue) || 10,
      current_value: 0,
      unit: goalUnit,
      deadline: deadline || 'In 7 Days',
      status: 'active',
      ai_note:
        aiNote ||
        `Anna AI Strategy: Target prioritized based on live store data for ${shop.name}.`,
    });

    // Reset & close
    setGoalTitle('');
    setShowNewGoalModal(false);
  };

  const handleConsultAnnaOnGoal = (goal: Goal) => {
    setChatInitialPrompt(
      `Help me reach my goal "${goal.title}". Current progress is ${goal.current_value}/${goal.target_value} ${goal.unit}. What tactics and WhatsApp offers should I run today?`
    );
    setActiveTab('chat');
  };

  const getCategoryColor = (cat: GoalCategory) => {
    switch (cat) {
      case 'clearance':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'revenue':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'vip_retention':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'units_sold':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const formatGoalValue = (val: number, unit: 'KES' | 'units' | 'customers') => {
    if (unit === 'KES') {
      return `KES ${val.toLocaleString()}`;
    }
    return `${val.toLocaleString()} ${unit}`;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> ANNA OS STRATEGIC BRAIN
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-mono text-neutral-400">Milestone Engine</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span>Store Goals &amp; Achieved Milestones</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Set concrete clearance targets, revenue milestones, and VIP re-engagement quotas that Anna OS cross-checks with POS sales and daily analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Set New Target</span>
          </button>
        </div>
      </div>

      {/* Futuristic Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>ACTIVE TARGETS</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeGoals.length}</div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{overallActiveCompletion}%</span> average completion
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>ACHIEVED GOALS</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{achievedGoals.length}</div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
            <span>Archived in Hall of Fame</span>
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>ACTIVE REVENUE PIPELINE</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white tabular-nums">
            KES {currentProgressKes.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Target: KES {totalTargetKes.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
            <span>UNLOCKED CAPITAL</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-300 tabular-nums">
            KES {(totalCapitalUnlocked + 100000).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            From dead stock &amp; bundle milestones
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Active vs Achieved Archive */}
      <div className="flex items-center justify-between gap-3 p-1.5 bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTabFilter('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTabFilter === 'active'
                ? 'bg-neutral-800 text-emerald-400 shadow-sm border border-neutral-700/80'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Targets</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {activeGoals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabFilter('achieved')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTabFilter === 'achieved'
                ? 'bg-neutral-800 text-amber-400 shadow-sm border border-neutral-700/80'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Achieved Goals Archive</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {achievedGoals.length}
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            setChatInitialPrompt(
              `Anna, review all my active goals and give me a tactical 3-step action plan to accomplish them before the weekend.`
            );
            setActiveTab('chat');
          }}
          className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 hover:text-emerald-300 font-mono transition-colors pr-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ask Anna for Goal Advice</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Active Goals View */}
      {activeTabFilter === 'active' && (
        <div className="space-y-4">
          {activeGoals.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30">
              <Target className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-200">No goals yet — run the AI Analyzer</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 mb-4">
                After demo setup, open Anna Analyzer and click "Run AI Analysis". Goals will be generated automatically — or create one manually below.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setActiveTab('analyzer')}
                  className="px-4 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Go to Anna Analyzer</span>
                </button>
                <button
                  onClick={() => setShowNewGoalModal(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Goal Manually</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                const remaining = Math.max(0, goal.target_value - goal.current_value);

                return (
                  <div
                    key={goal.id}
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 hover:border-neutral-700/80 transition-all flex flex-col justify-between space-y-4 shadow-lg group relative overflow-hidden"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(
                            goal.category
                          )}`}
                        >
                          {goal.category.replace('_', ' ')}
                        </span>

                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{goal.deadline || 'This Week'}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {goal.title}
                      </h3>

                      {goal.ai_note && (
                        <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs text-neutral-300 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{goal.ai_note}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Numerical Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-neutral-800/60">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <span className="font-bold text-white">
                            {formatGoalValue(goal.current_value, goal.unit)}
                          </span>
                          <span className="text-neutral-500">/</span>
                          <span className="text-neutral-400">
                            {formatGoalValue(goal.target_value, goal.unit)}
                          </span>
                        </div>
                        <span className="font-extrabold text-emerald-400">{percent}%</span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-neutral-950 overflow-hidden border border-neutral-800/70">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                        <span>
                          {remaining > 0
                            ? `Remaining: ${formatGoalValue(remaining, goal.unit)}`
                            : 'Ready to archive!'}
                        </span>
                        <span className="text-[10px] text-neutral-600">Auto-syncs on POS sales</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/60">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const step = goal.unit === 'KES' ? 25000 : 1;
                            updateGoalProgress(goal.id, step);
                          }}
                          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer border border-neutral-700/60"
                          title="Add progress manually"
                        >
                          +{goal.unit === 'KES' ? '25k' : '1'}
                        </button>

                        <button
                          onClick={() => markGoalAchieved(goal.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Mark Achieved</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleConsultAnnaOnGoal(goal)}
                          className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Discuss tactics with Anna Assistant"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span className="hidden sm:inline">Tactics</span>
                        </button>

                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Achieved Goals Archive */}
      {activeTabFilter === 'achieved' && (
        <div className="space-y-4">
          {achievedGoals.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30">
              <Trophy className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-200">No goals archived yet</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1">
                When you or your staff hit sales targets or clear dead stock in POS, they will be archived here in the Hall of Fame.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="p-5 rounded-2xl bg-neutral-900/70 border border-emerald-500/30 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-4 shadow-lg shadow-emerald-950/20 relative overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>ACHIEVED</span>
                      </span>

                      <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span>{goal.achieved_at || 'Recently'}</span>
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white line-through decoration-emerald-500/60 decoration-2">
                      {goal.title}
                    </h3>

                    <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 text-xs text-neutral-300 space-y-1">
                      <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Anna OS Impact Log</span>
                      </div>
                      <p className="text-neutral-400 leading-relaxed">
                        {goal.ai_note || 'Milestone achieved with full team execution and cash reconciliation.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">
                      Delivered: <strong className="text-white">{formatGoalValue(goal.target_value, goal.unit)}</strong>
                    </span>

                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-neutral-500 hover:text-red-400 p-1 text-xs cursor-pointer"
                      title="Remove from archive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Set New Goal Modal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0d13] border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Set Store Target with Anna AI</h3>
              </div>
              <button
                onClick={() => setShowNewGoalModal(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Templates */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-400">FAST AI TARGET TEMPLATES</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleSelectTemplate(
                      'Clear 18 Pleated Chiffon Maxi Dresses',
                      'clearance',
                      18,
                      'units',
                      'This Friday',
                      'Unlocks KES 81,000 dead stock. Run 15% WhatsApp broadcast discount.'
                    )
                  }
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-amber-300">👗 Maxi Dress Clearance</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">18 units · KES 81k value</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectTemplate(
                      'Reach KES 450,000 Weekly Boutique Sales',
                      'revenue',
                      450000,
                      'KES',
                      'This Sunday',
                      'Weekly revenue milestone to cover store rent & supplier fabric orders.'
                    )
                  }
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-emerald-300">💰 KES 450k Revenue</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Weekly boutique gross sales</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectTemplate(
                      'Win Back 8 Inactive VIP Fashionistas',
                      'vip_retention',
                      8,
                      'customers',
                      'In 5 Days',
                      'Target top VIPs who spent >50k but inactive 30+ days using KES 2,500 boutique voucher.'
                    )
                  }
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-purple-300">👑 Win Back 8 VIPs</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">High CLV fashion retention</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectTemplate(
                      'Style 30 Heels + Handbag Combos',
                      'units_sold',
                      30,
                      'units',
                      'End of Month',
                      'High-margin accessory bundle cross-sell at checkout lounge.'
                    )
                  }
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-cyan-300">👠 30 Heel + Bag Combos</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Counter bundle conversion</div>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateGoal} className="space-y-4 pt-2 border-t border-neutral-800">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">GOAL TITLE</label>
                <input
                  type="text"
                  required
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Clear 18 Chiffon Dresses or Reach KES 450k Boutique Sales"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">CATEGORY</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as GoalCategory)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="revenue">Revenue Target</option>
                    <option value="clearance">Dead Stock Clearance</option>
                    <option value="vip_retention">VIP Retention</option>
                    <option value="units_sold">Units Sold Target</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">UNIT</label>
                  <select
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value as any)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="KES">KES (Currency)</option>
                    <option value="units">Units (Stock/Items)</option>
                    <option value="customers">Customers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">TARGET VALUE</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">DEADLINE</label>
                  <input
                    type="text"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    placeholder="e.g. This Friday"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">AI TACTICAL STRATEGY NOTE</label>
                <textarea
                  rows={2}
                  value={aiNote}
                  onChange={(e) => setAiNote(e.target.value)}
                  placeholder="e.g. Unlocks working capital. Recommend 10% flash discount on WhatsApp."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950"
                >
                  Save &amp; Track Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
