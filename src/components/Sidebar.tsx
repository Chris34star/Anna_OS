import React from 'react';
import {
  BrainCircuit,
  Calendar,
  CheckSquare,
  ChevronRight,
  Database,
  Flame,
  Globe,
  Layers,
  Link,
  MessageSquare,
  MessageSquareCode,
  Package,
  Scissors,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  UserCheck,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { NavigationTab, useStore } from '../lib/store';

interface SidebarProps {
  onOpenSettings: (tab?: 'connectors' | 'templates' | 'model') => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenSettings,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    shop,
    tasks,
    insights,
    goals,
    currentUser,
    unreadAssistantCount,
    clearUnreadAssistantCount,
    connectors,
    setIsLandingPage,
  } = useStore();

  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;
  const activeInsightsCount = insights.filter((i) => !i.status || i.status === 'active').length;
  const liveConnectorsCount = connectors.filter((c) => c.status === 'connected').length;
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

  const isSalon = shop.type === 'salon_spa';

  // Base navigation items
  const allNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    isRedBadge?: boolean;
    accentColor?: string;
    permissionKey?: keyof typeof currentUser.permissions;
  }[] = [
    {
      id: 'analyzer',
      label: 'Anna Analyzer',
      icon: <BrainCircuit className="w-4 h-4 text-emerald-400" />,
      badge: activeInsightsCount > 0 ? `${activeInsightsCount}` : undefined,
      permissionKey: 'can_view_analyzer',
    },
    {
      id: 'pos',
      label: 'POS Register',
      icon: <ShoppingCart className="w-4 h-4 text-cyan-400" />,
      permissionKey: 'can_record_sales',
    },
    {
      id: 'inventory',
      label: shop.type === 'boutique' ? 'Clothes & Shoes Stock' : isSalon ? 'Product & Supply Stock' : 'Inventory & Stock',
      icon: <Package className="w-4 h-4 text-emerald-400" />,
      permissionKey: 'can_edit_inventory',
    },
    ...(isSalon
      ? [
          {
            id: 'appointments' as NavigationTab,
            label: 'Appointments',
            icon: <Scissors className="w-4 h-4 text-purple-400" />,
            badge: '4 Today',
          },
        ]
      : []),
    {
      id: 'tasks',
      label: 'Action Wall',
      icon: <CheckSquare className="w-4 h-4 text-purple-400" />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      permissionKey: 'can_manage_tasks',
    },
    {
      id: 'goals',
      label: 'Goals & Milestones',
      icon: <Target className="w-4 h-4 text-emerald-400" />,
      badge: activeGoalsCount > 0 ? `${activeGoalsCount}` : undefined,
      permissionKey: 'can_view_goals',
    },
    {
      id: 'content',
      label: 'Content Wall',
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      badge: 'Viral',
      permissionKey: 'can_view_content',
    },
    {
      id: 'customers',
      label: 'Customers & CRM',
      icon: <Users className="w-4 h-4 text-teal-400" />,
      permissionKey: 'can_view_customers',
    },
    {
      id: 'team',
      label: 'Team & Role Access',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'chat',
      label: 'Anna Assistant',
      icon: <MessageSquareCode className="w-4 h-4 text-rose-400" />,
      badge: unreadAssistantCount > 0 ? `${unreadAssistantCount}` : undefined,
      isRedBadge: unreadAssistantCount > 0,
    },
    {
      id: 'import',
      label: 'Data Import & Seed',
      icon: <Database className="w-4 h-4 text-neutral-400" />,
    },
  ];

  // Filter based on currentUser permissions
  const navItems = allNavItems.filter((item) => {
    if (!item.permissionKey) return true;
    return currentUser.permissions[item.permissionKey] !== false;
  });

  const handleNavClick = (tabId: NavigationTab) => {
    if (tabId === 'chat') {
      clearUnreadAssistantCount();
    }
    setActiveTab(tabId);
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container (Docked on desktop, Animated slide-in on mobile) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#090b10] border-r border-neutral-800/80 flex flex-col shrink-0 select-none shadow-2xl transition-transform duration-300 ease-in-out md:static md:w-64 md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand HUD Zone */}
        <div className="p-4 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-emerald-500/20">
                  A
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-white">Anna OS</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                    DUKA
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400 font-mono">Retail Cyber-OS</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onOpenSettings('templates');
                  onCloseMobile?.();
                }}
                title="Switch Industry Template"
                className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>

              {/* Close Button on Mobile */}
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Business Blueprint Pill */}
          <div className="mt-3 p-2 rounded-xl bg-neutral-900/80 border border-neutral-800/70 flex items-center justify-between text-xs">
            <div className="space-y-0.5 truncate max-w-[150px]">
              <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider">
                {shop.type.replace('_', ' ')}
              </span>
              <span className="font-semibold text-neutral-200 text-xs truncate block">
                {shop.name}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              <span>KES</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-mono font-semibold text-neutral-500 uppercase tracking-widest flex items-center justify-between">
            <span>Core Modules</span>
            <span className="text-[9px] text-emerald-500">AUTONOMOUS</span>
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-neutral-800/90 text-white font-bold shadow-lg shadow-black/40 border border-neutral-700/60'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="transition-transform group-hover:scale-110">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                      item.isRedBadge
                        ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-900/60 ring-2 ring-rose-500/30'
                        : isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Connectors Status & Settings Dock */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 space-y-2">
          {/* Active Staff User Card */}
          <button
            onClick={() => {
              setActiveTab('team');
              onCloseMobile?.();
            }}
            className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition-colors cursor-pointer group"
            title="Click to switch staff role"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 block truncate">
                  {currentUser.role_name}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 group-hover:text-emerald-300 transition-colors">
              Switch
            </span>
          </button>

          {/* Connectors Quick Bar */}
          <button
            onClick={() => {
              onOpenSettings('connectors');
              onCloseMobile?.();
            }}
            className="w-full p-2 rounded-xl bg-neutral-900/70 border border-neutral-800/60 hover:border-emerald-500/50 flex items-center justify-between transition-colors text-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Link className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium text-neutral-300">Live Connectors</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
              {liveConnectorsCount}/3 Active
            </span>
          </button>

          {/* Landing Page & System Controls row */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              onClick={() => setIsLandingPage(true)}
              className="flex-1 py-1.5 px-2 rounded-xl text-[11px] font-semibold text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              title="Return to Landing Page & Public Demo"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>Landing Page</span>
            </button>

            <button
              onClick={() => {
                onOpenSettings('model');
                onCloseMobile?.();
              }}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-colors cursor-pointer"
              title="System Controls & API Keys"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
