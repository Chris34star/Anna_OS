import React, { useState } from 'react';
import {
  Briefcase,
  Check,
  CheckCircle2,
  Coins,
  Filter,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { RoleName, TaskStatus } from '../types';

export const TasksView: React.FC = () => {
  const { tasks, updateTaskStatus, addTask, shop, currentUser, teamMembers, setActiveTab } = useStore();

  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [onlyMyTasks, setOnlyMyTasks] = useState(currentUser.role_name !== 'CEO');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newRole, setNewRole] = useState<string>(currentUser.role_name || 'Floor Cashier');

  const myAssignedTasks = tasks.filter(
    (t) =>
      t.assigned_role.toLowerCase() === currentUser.role_name.toLowerCase() ||
      (currentUser.role_name === 'Floor Cashier' && t.assigned_role.toLowerCase().includes('cashier')) ||
      (currentUser.role_name === 'Boutique Stylist' && t.assigned_role.toLowerCase().includes('stylist')) ||
      (currentUser.role_name === 'Stock Manager' && t.assigned_role.toLowerCase().includes('stock'))
  );

  const filteredTasks = tasks.filter((t) => {
    if (onlyMyTasks) {
      const isMine =
        t.assigned_role.toLowerCase() === currentUser.role_name.toLowerCase() ||
        (currentUser.role_name === 'Floor Cashier' && t.assigned_role.toLowerCase().includes('cashier')) ||
        (currentUser.role_name === 'Boutique Stylist' && t.assigned_role.toLowerCase().includes('stylist')) ||
        (currentUser.role_name === 'Stock Manager' && t.assigned_role.toLowerCase().includes('stock'));
      if (!isMine) return false;
    } else if (filterRole !== 'all') {
      if (t.assigned_role !== filterRole) return false;
    }
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesStatus;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addTask({
      assigned_role: newRole,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Directive from store management',
      status: 'pending',
    });

    setShowNewTaskModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const approvedCount = tasks.filter((t) => t.status === 'approved').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              ACTION WALL &amp; DELEGATION
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-mono text-neutral-400">Role-Specific Queue</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Executive Action Wall</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Auto-assigned from Anna OS Analyzer &amp; Store Management. Filtered by logged-in staff role.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('team')}
            className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            <span>Team &amp; Roles →</span>
          </button>

          <button
            onClick={() => setShowNewTaskModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Staff Session Alert Banner */}
      <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-neutral-200">
              Signed in as: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email})
            </div>
            <div className="text-[11px] text-neutral-400 font-mono">
              Assigned Role: <span className="text-emerald-400 font-bold">{currentUser.role_name}</span> ·{' '}
              {myAssignedTasks.length} tasks assigned to your role
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${
              onlyMyTasks
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
            }`}
          >
            {onlyMyTasks ? `✓ Showing My Tasks (${myAssignedTasks.length})` : 'Show All Store Tasks'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-950/80 text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'approved'
                ? 'bg-purple-950/80 text-purple-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Active ({approvedCount})
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'done'
                ? 'bg-emerald-950/80 text-emerald-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Done ({doneCount})
          </button>
        </div>

        {!onlyMyTasks && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Filter Role:</span>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-neutral-200 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="CEO">CEO</option>
              <option value="Floor Cashier">Floor Cashier</option>
              <option value="Boutique Stylist">Boutique Stylist</option>
              <option value="Stock Manager">Stock Manager</option>
            </select>
          </div>
        )}
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredTasks.map((task) => {
          const isPending = task.status === 'pending';
          const isApproved = task.status === 'approved';
          const isDone = task.status === 'done';

          return (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all ${
                isDone
                  ? 'bg-neutral-900/50 border-neutral-800/60 opacity-70'
                  : isApproved
                  ? 'bg-neutral-900 border-purple-800/40'
                  : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-800 text-neutral-200 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-neutral-400" />
                      {task.assigned_role}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isPending
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                          : isApproved
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                      }`}
                    >
                      {isPending ? 'Pending' : isApproved ? 'Approved' : 'Completed'}
                    </span>

                    {task.ai_suggestion && (
                      <span className="text-[10px] font-mono text-purple-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span>Anna OS Suggestion</span>
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-xs font-semibold ${
                      isDone ? 'line-through text-neutral-400' : 'text-neutral-100'
                    }`}
                  >
                    {task.title}
                  </h4>

                  <p className="text-xs text-neutral-400 line-clamp-2 max-w-2xl">
                    {task.description}
                  </p>

                  {task.ai_suggestion?.potential_impact_kes && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <Coins className="w-3 h-3" />
                      <span>KES {task.ai_suggestion.potential_impact_kes.toLocaleString()} Value Target</span>
                    </div>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPending && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'approved')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  )}

                  {!isDone && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'done')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Done</span>
                    </button>
                  )}

                  {isDone && (
                    <button
                      onClick={() => updateTaskStatus(task.id, 'pending')}
                      className="px-2 py-1 text-xs text-neutral-400 hover:text-white"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" /> New Directive
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Assign To Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as RoleName)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200"
                >
                  <option value="Floor Cashier">Floor Cashier</option>
                  <option value="Boutique Stylist">Boutique Stylist</option>
                  <option value="Stock Manager">Stock Manager</option>
                  <option value="CEO">CEO</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Directive Title</label>
                <input
                  type="text"
                  placeholder="e.g. Steam-press & re-rack evening dresses on front display"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Instructions</label>
                <textarea
                  placeholder="Task instructions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-neutral-100 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-1.5 text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
