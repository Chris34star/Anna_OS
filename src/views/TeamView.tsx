import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Key,
  Lock,
  Mail,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { RolePermissions, TeamMember } from '../types';

export const TeamView: React.FC = () => {
  const {
    teamMembers,
    currentUser,
    setCurrentUser,
    addTeamMember,
    updateTeamMemberPermissions,
    removeTeamMember,
    setActiveTab,
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // New Member Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Floor Cashier');

  // Permission toggles
  const [permissions, setPermissions] = useState<RolePermissions>({
    can_record_sales: true,
    can_manage_tasks: true,
    can_view_customers: true,
    can_edit_inventory: false,
    can_view_analyzer: false,
    can_view_content: false,
    can_view_goals: false,
    can_send_whatsapp: true,
    can_manage_team: false,
  });

  const handleRolePreset = (preset: 'cashier' | 'stylist' | 'stock' | 'manager') => {
    switch (preset) {
      case 'cashier':
        setRoleName('Floor Cashier');
        setPermissions({
          can_record_sales: true,
          can_manage_tasks: true,
          can_view_customers: true,
          can_edit_inventory: false,
          can_view_analyzer: false,
          can_view_content: false,
          can_view_goals: false,
          can_send_whatsapp: true,
          can_manage_team: false,
        });
        break;
      case 'stylist':
        setRoleName('Boutique Stylist');
        setPermissions({
          can_record_sales: true,
          can_manage_tasks: true,
          can_view_customers: true,
          can_edit_inventory: false,
          can_view_analyzer: false,
          can_view_content: true,
          can_view_goals: false,
          can_send_whatsapp: true,
          can_manage_team: false,
        });
        break;
      case 'stock':
        setRoleName('Stock Manager');
        setPermissions({
          can_record_sales: false,
          can_manage_tasks: true,
          can_view_customers: false,
          can_edit_inventory: true,
          can_view_analyzer: true,
          can_view_content: false,
          can_view_goals: true,
          can_send_whatsapp: false,
          can_manage_team: false,
        });
        break;
      case 'manager':
        setRoleName('Store Manager');
        setPermissions({
          can_record_sales: true,
          can_manage_tasks: true,
          can_view_customers: true,
          can_edit_inventory: true,
          can_view_analyzer: true,
          can_view_content: true,
          can_view_goals: true,
          can_send_whatsapp: true,
          can_manage_team: true,
        });
        break;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    addTeamMember({
      name: name.trim(),
      email: email.trim(),
      role_name: roleName.trim() || 'Floor Cashier',
      permissions,
    });

    setName('');
    setEmail('');
    setShowAddModal(false);
  };

  const handleSwitchUser = (member: TeamMember) => {
    setCurrentUser(member);
  };

  const handleTogglePermission = (key: keyof RolePermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getActivePermissionLabels = (perms: RolePermissions) => {
    const list: string[] = [];
    if (perms.can_record_sales) list.push('POS Checkout');
    if (perms.can_manage_tasks) list.push('Action Wall & Tasks');
    if (perms.can_edit_inventory) list.push('Inventory & Stock');
    if (perms.can_view_analyzer) list.push('Analyzer & Brief');
    if (perms.can_view_customers) list.push('Customer CRM');
    if (perms.can_view_content) list.push('Content Wall');
    if (perms.can_view_goals) list.push('Store Goals');
    if (perms.can_manage_team) list.push('Manage Team');
    return list;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> ROLE-BASED ACCESS CONTROL
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-mono text-neutral-400">Staff Email Auth</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Team Members, Roles &amp; Permissions</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Add staff emails, select granular view permissions, and sign in as different staff to test filtered dashboard views &amp; assigned tasks.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Team Member &amp; Role</span>
        </button>
      </div>

      {/* Active User Session Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-neutral-950 border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400 text-sm">
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">CURRENTLY SIGNED IN AS:</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {currentUser.role_name}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>{currentUser.name}</span>
              <span className="text-xs text-neutral-400 font-mono font-normal">({currentUser.email})</span>
            </h3>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono text-neutral-400">
              <span>Visible Modules:</span>
              {getActivePermissionLabels(currentUser.permissions).map((label, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.2 rounded bg-neutral-950 border border-neutral-800 text-neutral-300"
                >
                  ✓ {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tasks')}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-950 flex items-center gap-1.5 cursor-pointer"
          >
            <span>See {currentUser.name.split(' ')[0]}'s Tasks →</span>
          </button>
        </div>
      </div>

      {/* Team Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamMembers.map((member) => {
          const isCurrent = currentUser.id === member.id;
          const labels = getActivePermissionLabels(member.permissions);

          return (
            <div
              key={member.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden ${
                isCurrent
                  ? 'bg-neutral-900/90 border-emerald-500/50 shadow-emerald-950/20'
                  : 'bg-neutral-900/60 border-neutral-800/80 hover:border-neutral-700/80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{member.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300">
                            Active
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                        <Mail className="w-3 h-3 text-neutral-500" />
                        <span>{member.email}</span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700">
                    {member.role_name}
                  </span>
                </div>

                {/* Selected permissions list */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase">
                    Permissions &amp; Accessible Views ({labels.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {labels.map((p, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-950/80 text-emerald-300 border border-emerald-500/20 flex items-center gap-1"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{p}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                {isCurrent ? (
                  <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Signed In</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleSwitchUser(member)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Sign In as {member.name.split(' ')[0]}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                  </button>
                )}

                {member.role_name !== 'CEO' && (
                  <button
                    onClick={() => removeTeamMember(member.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remove team member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0d13] border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Add Team Member &amp; Set Permissions</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Role Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-neutral-400">QUICK ROLE PRESET</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRolePreset('cashier')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    roleName === 'Floor Cashier'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Cashier
                </button>

                <button
                  type="button"
                  onClick={() => handleRolePreset('stylist')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    roleName === 'Boutique Stylist'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Stylist
                </button>

                <button
                  type="button"
                  onClick={() => handleRolePreset('stock')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    roleName === 'Stock Manager'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Stock Lead
                </button>

                <button
                  type="button"
                  onClick={() => handleRolePreset('manager')}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    roleName === 'Store Manager'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Manager
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleAddSubmit} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">STAFF FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Atieno"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-400 mb-1">STAFF EMAIL</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.cashier@amaniluxe.co.ke"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">ROLE TITLE</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g. Floor Cashier, Senior Stylist, Stock Supervisor"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Granular Permission Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-neutral-300 font-bold">
                    SELECT THINGS THEY SHOULD SEE &amp; DO:
                  </label>
                  <span className="text-[10px] text-neutral-500">Affects dashboard &amp; sidebar</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_record_sales}
                      onChange={() => handleTogglePermission('can_record_sales')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">POS Cash Register</span>
                      <span className="text-[10px] text-neutral-400">Ring up sales, receipts, M-Pesa float</span>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_manage_tasks}
                      onChange={() => handleTogglePermission('can_manage_tasks')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">Action Wall &amp; Tasks</span>
                      <span className="text-[10px] text-neutral-400">View and execute assigned daily tasks</span>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_view_customers}
                      onChange={() => handleTogglePermission('can_view_customers')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">Customer CRM</span>
                      <span className="text-[10px] text-neutral-400">View VIP shoppers &amp; spending ledger</span>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_edit_inventory}
                      onChange={() => handleTogglePermission('can_edit_inventory')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">Inventory &amp; Stock</span>
                      <span className="text-[10px] text-neutral-400">Adjust dress/shoe quantities &amp; sizes</span>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_view_analyzer}
                      onChange={() => handleTogglePermission('can_view_analyzer')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">Anna Business Analyzer</span>
                      <span className="text-[10px] text-neutral-400">Dead stock radar &amp; financial KPIs</span>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_view_content}
                      onChange={() => handleTogglePermission('can_view_content')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">Social Content Wall</span>
                      <span className="text-[10px] text-neutral-400">TikTok OOTD scripts &amp; WhatsApp drops</span>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_view_goals}
                      onChange={() => handleTogglePermission('can_view_goals')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">Strategic Goals</span>
                      <span className="text-[10px] text-neutral-400">Clearance targets &amp; weekly milestones</span>
                    </div>
                  </label>

                  <label className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions.can_send_whatsapp}
                      onChange={() => handleTogglePermission('can_send_whatsapp')}
                      className="mt-0.5 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-white block">WhatsApp Broadcasts</span>
                      <span className="text-[10px] text-neutral-400">Send VIP win-back promo messages</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950"
                >
                  Save Staff &amp; Assign Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
