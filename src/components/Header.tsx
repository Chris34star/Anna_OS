import React from 'react';
import { Database, Flame, Globe, Layers, Menu, Plus, ShieldCheck, ShoppingCart, Sparkles, UserCheck } from 'lucide-react';
import { NavigationTab, useStore } from '../lib/store';

interface HeaderProps {
  onOpenSettings: (tab?: 'connectors' | 'templates' | 'model') => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onToggleMobileMenu }) => {
  const {
    activeTab,
    setActiveTab,
    shop,
    seedDemoData,
    isSeeding,
    products,
    customers,
    currentUser,
    setIsLandingPage,
  } = useStore();

  const tabLabels: Record<NavigationTab, string> = {
    analyzer: 'Anna Intelligence Brief',
    pos: 'POS Register & Multi-Item Terminal',
    inventory: 'Inventory & Stock Catalog',
    appointments: 'Appointments & Booking Schedule',
    goals: 'Store Goals & Achieved Milestones',
    content: 'Marketing & Social Content Wall',
    customers: 'Customers & CRM Ledger',
    tasks: 'Executive Action Wall',
    team: 'Team Members, Roles & Access',
    chat: 'Anna Assistant & Strategic Q&A',
    import: 'Data Ingestion & Demo Seeder',
    landing: 'Public Landing Page',
    onboarding: 'Store Setup & Onboarding Agent',
  };

  return (
    <header className="h-14 border-b border-neutral-800/80 bg-[#090b10]/90 backdrop-blur-xl px-4 sm:px-5 flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Zone 1: Mobile Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-2.5">
        {/* Mobile 3-dashboard menu button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
          aria-label="Toggle navigation drawer"
          title="Open Menu"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
        </button>

        <span className="text-xs font-mono font-bold text-emerald-400">ANNA.OS</span>
        <span className="text-neutral-700 font-mono">/</span>
        <h1 className="text-xs font-bold text-neutral-100 whitespace-nowrap tracking-wide truncate max-w-[130px] sm:max-w-none">
          {tabLabels[activeTab] || 'Boutique Terminal'}
        </h1>

        <button
          onClick={() => setActiveTab('team')}
          className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 hover:bg-emerald-900/60 transition-colors ml-2 cursor-pointer"
          title="Switch staff member or edit permissions"
        >
          <UserCheck className="w-3 h-3 text-emerald-400" />
          <span>{currentUser.name.split(' ')[0]} ({currentUser.role_name})</span>
        </button>
      </div>

      {/* Zone 2: Futuristic telemetry stats */}
      <div className="hidden xl:flex items-center gap-3 text-xs text-neutral-400 font-mono tabular-nums">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{products.length} Items</span>
        </div>
        <span className="text-neutral-700">·</span>
        <span>{customers.length} Profiles</span>
        <span className="text-neutral-700">·</span>
        <span className="text-emerald-400 font-bold">{shop.currency}</span>
      </div>

      {/* Zone 3: Quick Action Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsLandingPage(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all cursor-pointer"
          title="View Landing Page"
        >
          <Globe className="w-3 h-3 text-emerald-400" />
          <span>Landing Page</span>
        </button>

        <button
          onClick={() => onOpenSettings('connectors')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all cursor-pointer"
          title="Connect WhatsApp, Gmail, and Website"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Connectors</span>
        </button>

        <button
          onClick={seedDemoData}
          disabled={isSeeding}
          className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          title="Reset 50 products, 100 customers, 200 sales"
        >
          <Database className={`w-3.5 h-3.5 text-emerald-400 ${isSeeding ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Reset Demo'}</span>
        </button>

        {activeTab !== 'pos' && (
          <button
            onClick={() => setActiveTab('pos')}
            className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>POS</span>
          </button>
        )}
      </div>
    </header>
  );
};
