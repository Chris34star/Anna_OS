import React, { useState } from 'react';
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Flame,
  Globe,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Package,
  Play,
  Scissors,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useStore } from '../lib/store';

export const LandingPageView: React.FC = () => {
  const {
    setIsLandingPage,
    setActiveTab,
    signInWithSocial,
    authUser,
    signOut,
    shop,
    products,
  } = useStore();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState<string | null>(null);

  const handleLaunchDemo = () => {
    setIsLandingPage(false);
    setActiveTab('demo-setup');
  };

  // Asstensha Google Auth: real-store entry — requires store name+email, then opens AI setup chat (onboarding), never demo.
  const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'apple' | 'email') => {
    setAuthLoading(provider);
    await new Promise((r) => setTimeout(r, 600));

    // Real store needs owner identity first — use the form values for every provider (incl. Google).
    const email = authEmail.trim();
    const name = authName.trim() || 'Store Owner';
    if (!email) {
      setAuthLoading(null);
      return; // keep modal open so user enters store email + name
    }
    signInWithSocial(provider, email, name);

    setAuthLoading(null);
    setShowAuthModal(false);
    setIsLandingPage(false);
    setActiveTab('onboarding');
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-neutral-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar */}
      <nav className="h-16 border-b border-neutral-800/80 bg-[#090b10]/90 backdrop-blur-xl px-5 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-950 font-mono font-black text-white text-xs">
            AO
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">ANNA OS</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                RETAIL &amp; COMMERCE AI
              </span>
            </div>
            <p className="text-[10px] font-mono text-neutral-400">Autonomous Store Operating System for SMBs</p>
          </div>
        </div>

        {/* Center links (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-6 text-xs text-neutral-400 font-medium">
          <a href="#features" className="hover:text-emerald-400 transition-colors">
            AI Analyzer
          </a>
          <a href="#pos" className="hover:text-emerald-400 transition-colors">
            Multi-Item POS
          </a>
          <a href="#roles" className="hover:text-emerald-400 transition-colors">
            Role Logins
          </a>
          <a href="#whatsapp" className="hover:text-emerald-400 transition-colors">
            WhatsApp Engine
          </a>
          <a href="#verticals" className="hover:text-emerald-400 transition-colors">
            Store Blueprints
          </a>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2.5">
          {authUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setIsLandingPage(false); setActiveTab('onboarding'); }}
                className="px-3 py-1.5 text-xs font-bold text-emerald-400 bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 rounded-xl transition-all cursor-pointer"
              >
                Go to {authUser.name.split(' ')[0]}'s Store →
              </button>
              <button
                onClick={signOut}
                className="text-xs text-neutral-500 hover:text-red-400 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={handleLaunchDemo}
                className="px-3.5 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3 h-3 text-emerald-400 fill-current" />
                <span>Explore Demo</span>
              </button>

              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Get Started Real Store</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 max-w-6xl mx-auto text-center space-y-6">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-300 shadow-sm animate-in fade-in duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Autonomous Store OS for Small &amp; Medium Retailers</span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-400">Boutique Demo Showcase · Llama 3</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Run your retail shop &amp; store on{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            autonomous AI
          </span>
          .
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-3xl mx-auto leading-relaxed">
          Say goodbye to spreadsheet chaos. Anna OS is the all-in-one store operating system built for small to medium retail businesses—from boutiques and electronics stores to supermarkets, salons, and hardware shops. Featuring a visual multi-item POS register, automated 45-day dead stock discovery, Meta WhatsApp VIP re-engagement, and granular staff role permissions.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={handleLaunchDemo}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-current" />
            <span>Explore Demo</span>
          </button>

          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-950 flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Get Started with Your Real Store</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Social Proof Bar */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-mono text-neutral-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Multi-Item Visual POS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Automated 45-Day Dead Stock Discovery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Staff Email Roles &amp; Task Wall</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Meta WhatsApp Cloud API</span>
          </div>
        </div>
      </section>

      {/* Multi-Industry Retail Blueprints Showcase */}
      <section id="verticals" className="py-10 px-4 sm:px-6 max-w-6xl mx-auto border-t border-neutral-800/60 space-y-6">
        <div className="text-center space-y-1.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            ADAPTIVE COMMERCE BLUEPRINTS
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Pre-Configured for Every Small &amp; Medium Retail Sector
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl mx-auto">
            Anna OS dynamically shifts inventory attributes, role permissions, and POS columns based on your specific business vertical.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Blueprint 1: Boutique (Flagship Demo) */}
          <div className="p-4 rounded-2xl bg-neutral-900/90 border-2 border-emerald-500/80 shadow-lg shadow-emerald-950/40 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-lg">👗</span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500 text-neutral-950">
                ACTIVE DEMO
              </span>
            </div>
            <div className="font-bold text-white">Boutique &amp; Footwear</div>
            <p className="text-[11px] text-neutral-400 leading-normal">
              Size (XS-XL, EU 38-42), color variants, dresses/boots bundle rules, and 45-day clearance drops.
            </p>
          </div>

          {/* Blueprint 2: Electronics */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg">📱</span>
              <span className="text-[9px] font-mono text-neutral-500">READY</span>
            </div>
            <div className="font-bold text-white">Electronics &amp; Tech</div>
            <p className="text-[11px] text-neutral-400 leading-normal">
              IMEI/serial number tracking, warranty months, repair technician status, and battery bundle discounts.
            </p>
          </div>

          {/* Blueprint 3: Supermarket / Mini-Mart */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg">🛒</span>
              <span className="text-[9px] font-mono text-neutral-500">READY</span>
            </div>
            <div className="font-bold text-white">Supermarket &amp; Groceries</div>
            <p className="text-[11px] text-neutral-400 leading-normal">
              Barcode scan checkout, batch expiry date tracking, fast register lane mode, and perishable alerts.
            </p>
          </div>

          {/* Blueprint 4: Salon / Spa */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg">✂️</span>
              <span className="text-[9px] font-mono text-neutral-500">READY</span>
            </div>
            <div className="font-bold text-white">Salon, Barbershop &amp; Spa</div>
            <p className="text-[11px] text-neutral-400 leading-normal">
              Stylist commission tracking, client appointment schedule, treatment duration, and VIP beauty alerts.
            </p>
          </div>

          {/* Blueprint 5: Hardware & Supplies */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg">🔨</span>
              <span className="text-[9px] font-mono text-neutral-500">READY</span>
            </div>
            <div className="font-bold text-white">Hardware &amp; Building</div>
            <p className="text-[11px] text-neutral-400 leading-normal">
              Bulk weight/bag pricing, contractor credit ledgers, yard supervisor dispatch, and reorder triggers.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Feature Matrix */}
      <section id="features" className="py-14 px-4 sm:px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            FOUR ENGINE ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Engineered for High-Velocity Retail &amp; Commerce
          </h2>
          <p className="text-xs text-neutral-400 max-w-xl mx-auto">
            Everything your store needs—from counter ring-ups to autonomous AI business analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Visual Multi-Item POS</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Ring up multiple items in one receipt. Instant M-Pesa float calculation, custom size/variant options, and customer loyalty phone lookups.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Llama 3 Business Brain</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Autonomously flags 45-day stagnant stock, detects high-spending VIP customer churn before they walk, and reveals 4x cross-sell bundle pairings.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Staff Roles &amp; Action Wall</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Add staff with their exact emails and granular tab privileges (Cashiers see POS &amp; Tasks; Stock Leads manage inventory; CEOs see analytics).
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 hover:border-emerald-500/40 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">WhatsApp &amp; Content Engine</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              1-click Sheng &amp; English WhatsApp promotional broadcasts via Meta Cloud API, plus daily viral marketing hooks and social media concepts.
            </p>
          </div>
        </div>
      </section>

      {/* Live Catalog Preview Section */}
      <section id="pos" className="py-12 px-4 sm:px-6 max-w-6xl mx-auto border-t border-neutral-800/80">
        <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FEATURED INTERACTIVE DEMO · BOUTIQUE &amp; APPAREL SHOWCASE
              </div>
              <h3 className="text-xl font-bold text-white">
                {shop.name}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Experience real-time visual POS, 45-day dead stock discovery, and WhatsApp re-engagement. (Choose any retail vertical for your real store).
              </p>
            </div>

            <button
              onClick={handleLaunchDemo}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shadow-lg shadow-emerald-950"
            >
              <span>Explore Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {products.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                  <span className="text-emerald-400">{p.category}</span>
                  <span>Stock: {p.stock_qty}</span>
                </div>
                <div className="font-bold text-white truncate">{p.name}</div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-900 font-mono">
                  <span className="text-emerald-400 font-bold">
                    KES {p.sell_price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {String(p.custom_fields?.size || 'All Sizes')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Sign In / Get Started Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0d13] border border-neutral-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  AO
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Get Started with Anna OS</h3>
                  <p className="text-[10px] text-neutral-400 font-mono">Launch your store (Boutique, Electronics, Retail &amp; more)</p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Real Social Auth Providers */}
            <div className="space-y-2.5">
              {/* Google */}
              <button
                onClick={() => handleSocialSignIn('google')}
                disabled={!!authLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{authLoading === 'google' ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              {/* Apple ID */}
              <button
                onClick={() => handleSocialSignIn('apple')}
                disabled={!!authLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.73-7.97-12.13-14.68-6.19-9.5-10.99-20.14-14.42-31.91-3.42-11.78-5.14-23.01-5.14-33.72 0-14.28 3.57-26.24 10.71-35.88 7.14-9.64 16.27-14.58 27.4-14.81 4.92 0 10.42 1.25 16.5 3.75 6.09 2.5 10.3 3.81 12.63 3.93 2.13-.12 6.43-1.47 12.9-4.04 6.47-2.57 11.89-3.74 16.26-3.52 12.44.68 22.42 5.09 29.93 13.23-10.87 6.64-16.19 15.68-15.96 27.12.23 9.07 3.75 16.82 10.57 23.25 6.82 6.43 14.88 10.09 24.18 10.98-2.13 6.44-4.58 12.92-7.36 19.44zM119.22 31.81c0-7.25 2.66-14.15 7.98-20.69 5.32-6.54 11.87-10.46 19.65-11.76.23 1.13.35 2.15.35 3.06 0 7.36-2.73 14.33-8.19 20.91-5.46 6.58-12.06 10.49-19.79 11.73v-3.25z" />
                </svg>
                <span>{authLoading === 'apple' ? 'Connecting to Apple...' : 'Continue with Apple ID'}</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleSocialSignIn('facebook')}
                disabled={!!authLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>{authLoading === 'facebook' ? 'Connecting to Facebook...' : 'Continue with Facebook'}</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-neutral-800 w-full" />
              <span className="bg-[#0b0d13] px-2 text-[10px] font-mono text-neutral-500 uppercase">
                Or Direct Email
              </span>
              <div className="border-t border-neutral-800 w-full" />
            </div>

            {/* Email form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSocialSignIn('email');
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">YOUR NAME</label>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Chrisandus Odhiambo"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 mb-1">STORE EMAIL</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="chrisandusodhiambo80@gmail.com"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={!!authLoading || !authEmail.trim()}
                className="w-full py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Launch Real Store Workspace</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
