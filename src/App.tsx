/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AnalyzerView } from './views/AnalyzerView';
import { POSView } from './views/POSView';
import { InventoryView } from './views/InventoryView';
import { ContentWallView } from './views/ContentWallView';
import { GoalsView } from './views/GoalsView';
import { AppointmentsView } from './views/AppointmentsView';
import { CustomersView } from './views/CustomersView';
import { TasksView } from './views/TasksView';
import { TeamView } from './views/TeamView';
import { ChatView } from './views/ChatView';
import { AIChatView } from './views/AIChatView';
import { DashboardView } from './views/DashboardView';
import { MessagingView } from './views/MessagingView';
import { ImportView } from './views/ImportView';
import { OnboardingView } from './views/OnboardingView';
import { LandingPageView } from './views/LandingPageView';
import { SettingsModal } from './components/SettingsModal';
import { ChatBubble } from './components/ChatBubble';

function AppContent() {
  const { activeTab, isLandingPage } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<'connectors' | 'templates' | 'model'>('connectors');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleOpenSettings = (tab: 'connectors' | 'templates' | 'model' = 'connectors') => {
    setSettingsDefaultTab(tab);
    setIsSettingsOpen(true);
  };

  // If user toggles to Landing Page, render the full-screen landing view
  if (isLandingPage) {
    return <LandingPageView />;
  }

  // Setup chat runs alone: no sidebar modules, header, or chat bubble —
  // the AI builds the modules, so they only appear after setup finishes.
  // (demo-setup route removed — real AI onboarding only.)
  if (activeTab === 'onboarding') {
    return <OnboardingView />;
  }

  return (
    <div className="flex h-screen w-full bg-[#08090d] text-neutral-100 overflow-hidden font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Sidebar Navigation (Hidden on mobile by default, toggled via hamburger drawer) */}
      <Sidebar
        onOpenSettings={handleOpenSettings}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-radial from-neutral-900/30 via-neutral-950/80 to-[#08090d]">
        {/* Top Bar Header with Hamburger menu button */}
        <Header
          onOpenSettings={handleOpenSettings}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'analyzer' && <AnalyzerView />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'ai-chat' && <AIChatView />}
          {activeTab === 'messaging' && <MessagingView />}
          {activeTab === 'pos' && <POSView />}
          {activeTab === 'inventory' && <InventoryView />}
          {activeTab === 'goals' && <GoalsView />}
          {activeTab === 'content' && <ContentWallView />}
          {activeTab === 'appointments' && <AppointmentsView />}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'tasks' && <TasksView />}
          {activeTab === 'team' && <TeamView />}
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'import' && <ImportView />}
          {activeTab === 'onboarding' && <OnboardingView />}
        </main>
      </div>

      {/* Settings & Connectors Control Center */}
      {isSettingsOpen && (
        <SettingsModal
          defaultTab={settingsDefaultTab}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Global AI chat bubble — every page */}
      <ChatBubble />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
