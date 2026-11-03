import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Cpu,
  Globe,
  Key,
  Layers,
  Link,
  Mail,
  MessageSquare,
  Radio,
  RefreshCw,
  Scissors,
  Sliders,
  Sparkles,
  Store,
  Wifi,
  X,
} from 'lucide-react';
import { getGroqApiKey, setGroqApiKey } from '../lib/llama';
import { useStore } from '../lib/store';
import { ConnectorId, ShopType } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  defaultTab?: 'connectors' | 'templates' | 'model';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, defaultTab = 'connectors' }) => {
  const {
    shop,
    connectors,
    updateConnectorConfig,
    testConnectorHandshake,
    changeStoreTemplate,
    seedDemoData,
    resetToInitial,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'connectors' | 'templates' | 'model'>(defaultTab);

  // Groq Key
  const [apiKey, setApiKey] = useState(getGroqApiKey());
  const [savedKeyMsg, setSavedKeyMsg] = useState(false);

  // Active connector being edited / tested
  const [activeConnectorId, setActiveConnectorId] = useState<ConnectorId>('whatsapp');
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Form states for connectors
  const whatsapp = connectors.find((c) => c.id === 'whatsapp');
  const [waPhoneId, setWaPhoneId] = useState(whatsapp?.config.phone_number_id || '');
  const [waToken, setWaToken] = useState(whatsapp?.config.api_token || '');

  const gmail = connectors.find((c) => c.id === 'gmail');
  const [gmEmail, setGmEmail] = useState(gmail?.config.gmail_address || '');
  const [gmReceipts, setGmReceipts] = useState(gmail?.config.auto_email_receipts ?? true);

  const website = connectors.find((c) => c.id === 'website');
  const [webUrl, setWebUrl] = useState(website?.config.storefront_url || '');
  const [webPlatform, setWebPlatform] = useState(website?.config.storefront_platform || 'shopify');
  const [webSecret, setWebSecret] = useState(website?.config.secret_key || '');

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGroqApiKey(apiKey);
    setSavedKeyMsg(true);
    setTimeout(() => setSavedKeyMsg(false), 2000);
  };

  const handleConnectWhatsApp = async () => {
    setIsTesting(true);
    setTestSuccess(false);
    updateConnectorConfig('whatsapp', {
      phone_number_id: waPhoneId,
      api_token: waToken,
    });
    const ok = await testConnectorHandshake('whatsapp');
    setIsTesting(false);
    setTestSuccess(ok);
  };

  const handleConnectGmail = async () => {
    setIsTesting(true);
    setTestSuccess(false);
    updateConnectorConfig('gmail', {
      gmail_address: gmEmail,
      auto_email_receipts: gmReceipts,
    });
    const ok = await testConnectorHandshake('gmail');
    setIsTesting(false);
    setTestSuccess(ok);
  };

  const handleConnectWebsite = async () => {
    setIsTesting(true);
    setTestSuccess(false);
    updateConnectorConfig('website', {
      storefront_url: webUrl,
      storefront_platform: webPlatform as any,
      secret_key: webSecret,
    });
    const ok = await testConnectorHandshake('website');
    setIsTesting(false);
    setTestSuccess(ok);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-1.5">
                <span>Anna OS Control Center</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300">
                  SYSTEM
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">Connectors, Dynamic Navs &amp; Engine Config</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Switcher Tabs */}
        <div className="px-6 pt-3 pb-2 bg-neutral-950/40 border-b border-neutral-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('connectors')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'connectors'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link className="w-3.5 h-3.5 text-emerald-400" />
            <span>Connectors &amp; Extensions</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'templates'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Adaptive Business Template</span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'model'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Model &amp; Data</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* TAB 1: CONNECTORS & EXTENSIONS */}
          {activeTab === 'connectors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                    Automated AI Connectors
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Anna connects autonomously when provided credentials, streaming webhooks to your POS and Analyzer.
                  </p>
                </div>
              </div>

              {/* Connector Pills */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveConnectorId('whatsapp');
                    setTestSuccess(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeConnectorId === 'whatsapp'
                      ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-bold text-xs text-white">WhatsApp API</div>
                  <div className="text-[10px] text-emerald-300 font-mono">Meta Graph v18</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConnectorId('gmail');
                    setTestSuccess(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeConnectorId === 'gmail'
                      ? 'bg-purple-950/40 border-purple-500/80 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                  </div>
                  <div className="font-bold text-xs text-white">Gmail Workspace</div>
                  <div className="text-[10px] text-purple-300 font-mono">Receipt Invoicing</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveConnectorId('website');
                    setTestSuccess(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    activeConnectorId === 'website'
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  </div>
                  <div className="font-bold text-xs text-white">Custom Web/Store</div>
                  <div className="text-[10px] text-cyan-300 font-mono">Shopify / Woo</div>
                </button>
              </div>

              {/* Active Connector Settings Panel */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-4">
                {activeConnectorId === 'whatsapp' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" /> Meta WhatsApp Cloud API Extension
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {whatsapp?.last_sync} · {whatsapp?.sync_count} broadcasts sent
                      </span>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">WhatsApp Phone Number ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 109841298412091"
                        value={waPhoneId}
                        onChange={(e) => setWaPhoneId(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Permanent Meta Access Token</label>
                      <input
                        type="password"
                        placeholder="EAAG84..."
                        value={waToken}
                        onChange={(e) => setWaToken(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectWhatsApp}
                      disabled={isTesting}
                      className="w-full py-2.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wifi className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'AI Handshake in Progress...' : 'Run AI Handshake & Save'}</span>
                    </button>
                  </div>
                )}

                {activeConnectorId === 'gmail' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                      <span className="font-bold text-purple-400 flex items-center gap-1.5">
                        <Mail className="w-4 h-4" /> Gmail Workspace Sync
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {gmail?.last_sync} · {gmail?.sync_count} receipts emailed
                      </span>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Store Sender Gmail / Workspace Email</label>
                      <input
                        type="email"
                        placeholder="pos@anna-duka.co.ke"
                        value={gmEmail}
                        onChange={(e) => setGmEmail(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="autoReceipts"
                        checked={gmReceipts}
                        onChange={(e) => setGmReceipts(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 bg-neutral-900 border-neutral-700"
                      />
                      <label htmlFor="autoReceipts" className="text-neutral-300">
                        Automatically dispatch PDF M-Pesa receipts upon checkout
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectGmail}
                      disabled={isTesting}
                      className="w-full py-2.5 font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-900/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wifi className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Verifying Gmail Auth...' : 'Connect Gmail Extension'}</span>
                    </button>
                  </div>
                )}

                {activeConnectorId === 'website' && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <Globe className="w-4 h-4" /> Custom Web Storefront &amp; API
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">
                        {website?.last_sync} · {website?.sync_count} webhook events
                      </span>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Storefront Platform</label>
                      <select
                        value={webPlatform}
                        onChange={(e) => setWebPlatform(e.target.value as any)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white"
                      >
                        <option value="shopify">Shopify Storefront Webhook</option>
                        <option value="woocommerce">WooCommerce REST API</option>
                        <option value="custom_api">Custom Website (REST / GraphQL)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Website URL</label>
                      <input
                        type="url"
                        placeholder="https://amaniluxe.co.ke"
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Webhook Secret / API Key</label>
                      <input
                        type="password"
                        placeholder="shpat_..."
                        value={webSecret}
                        onChange={(e) => setWebSecret(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectWebsite}
                      disabled={isTesting}
                      className="w-full py-2.5 font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all shadow-md shadow-cyan-900/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wifi className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'AI Syncing Storefront...' : 'Activate Storefront Webhook'}</span>
                    </button>
                  </div>
                )}

                {testSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>AI Handshake Verified! Webhook stream active &amp; healthy (latency 24ms).</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ADAPTIVE TEMPLATES & DYNAMIC NAVS */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                  Adaptive Business Blueprint
                </h4>
                <p className="text-[11px] text-neutral-400">
                  Switching blueprint dynamically adapts sidebar workspaces, column arrangements, and POS fields.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Boutique & Apparel */}
                <button
                  type="button"
                  onClick={() => changeStoreTemplate('boutique')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    shop.type === 'boutique'
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Store className="w-5 h-5 text-emerald-400" />
                    {shop.type === 'boutique' && (
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">ACTIVE (DEFAULT)</span>
                    )}
                  </div>
                  <h5 className="font-bold text-xs text-white">Boutique, Clothes &amp; Shoes</h5>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Multi-item apparel register, sizes/colors variants, 45-day dead stock clearance, WhatsApp drops.
                  </p>
                </button>

                {/* Salon / Spa */}
                <button
                  type="button"
                  onClick={() => changeStoreTemplate('salon_spa')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    shop.type === 'salon_spa'
                      ? 'bg-purple-950/30 border-purple-500 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Scissors className="w-5 h-5 text-purple-400" />
                    {shop.type === 'salon_spa' && (
                      <span className="text-[10px] font-bold text-purple-400 font-mono">ACTIVE</span>
                    )}
                  </div>
                  <h5 className="font-bold text-xs text-white">Salon, Barbershop &amp; Spa</h5>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Adds Appointments &amp; Stylist Schedule workspace, service duration, client VIP care.
                  </p>
                </button>

                {/* Supermarket */}
                <button
                  type="button"
                  onClick={() => changeStoreTemplate('supermarket')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    shop.type === 'supermarket'
                      ? 'bg-cyan-950/30 border-cyan-500 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Store className="w-5 h-5 text-cyan-400" />
                    {shop.type === 'supermarket' && (
                      <span className="text-[10px] font-bold text-cyan-400 font-mono">ACTIVE</span>
                    )}
                  </div>
                  <h5 className="font-bold text-xs text-white">Supermarket &amp; Retail Grocery</h5>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Fast barcode checkout, expiry date rotation, batch numbers, high-volume inventory.
                  </p>
                </button>

                {/* Hardware */}
                <button
                  type="button"
                  onClick={() => changeStoreTemplate('hardware')}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    shop.type === 'hardware'
                      ? 'bg-amber-950/30 border-amber-500 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    {shop.type === 'hardware' && (
                      <span className="text-[10px] font-bold text-amber-400 font-mono">ACTIVE</span>
                    )}
                  </div>
                  <h5 className="font-bold text-xs text-white">Hardware &amp; Construction</h5>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Unit weight, bulk site deliveries, yard supervisors, supplier contractor accounts.
                  </p>
                </button>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-between text-xs text-neutral-400">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>AI Dynamic Navigation Rearrangement:</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">Enabled (Autonomous)</span>
              </div>
            </div>
          )}

          {/* TAB 3: MODEL & DATA */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">Active AI Engine</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800/40 text-purple-300">
                    meta-musepark-1.3
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  Runs localized Kenyan retail business intelligence (KES, dead stock velocity, Sheng/English copy).
                </p>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  AI API Key (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="gsk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-200 focus:outline-hidden focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-xl transition-colors shrink-0"
                  >
                    {savedKeyMsg ? 'Saved!' : 'Save Key'}
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-neutral-800 flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await seedDemoData();
                    onClose();
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Re-Seed Demo Data</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetToInitial();
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-rose-400 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-colors"
                >
                  Factory Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
