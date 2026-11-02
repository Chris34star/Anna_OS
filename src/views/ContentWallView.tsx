import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Film,
  Flame,
  MessageSquare,
  Music,
  Plus,
  Radio,
  RefreshCw,
  Send,
  Share2,
  Sparkles,
  Target,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { ContentIdea, ContentPlatform } from '../types';

export const ContentWallView: React.FC = () => {
  const {
    contentIdeas,
    generateDailyContent,
    curateContentIdea,
    addContentIdea,
    updateContentIdeaStatus,
    products,
    shop,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'daily' | 'elected' | 'discarded'>('daily');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Idea Form
  const [customProduct, setCustomProduct] = useState(products[0]?.name || 'Pleated Chiffon Floral Maxi Dress');
  const [customPlatform, setCustomPlatform] = useState<ContentPlatform>('tiktok_reels');
  const [customAngle, setCustomAngle] = useState('Clearance Drop Test');

  // Filter ideas by curation state
  const dailyProposals = contentIdeas.filter(
    (c) => c.curation_state === 'new_daily' || (!c.curation_state && c.status === 'draft')
  );
  const electedPosts = contentIdeas.filter(
    (c) => c.curation_state === 'selected' || (!c.curation_state && (c.status === 'approved' || c.status === 'posted'))
  );
  const discardedPosts = contentIdeas.filter((c) => c.curation_state === 'discarded');

  const handleGenerateDaily = async () => {
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 600));
    generateDailyContent();
    setIsGenerating(false);
    setActiveTab('daily');
  };

  const handleCopyScript = (idea: ContentIdea) => {
    const text = `HOOK: ${idea.hook}\n\nSCRIPT:\n${idea.script_body}\n\nCTA: ${idea.call_to_action}\nAUDIO: ${idea.suggested_audio_trend || 'Trending Sound'}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(idea.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    addContentIdea({
      platform: customPlatform,
      title: `${customProduct} - Viral ${customAngle} Spotlight`,
      hook: `Nairobi fashion lovers, check this fit! ✨ How to style ${customProduct} for brunch or date night!`,
      script_body: `1. High-fashion 360-degree mirror pan showcasing the premium cut and fabric of ${customProduct}.\n2. Break down the look with matching heels & luxury leather handbag.\n3. Flash Anna OS boutique deal: 15% VIP bundle discount today only.\n4. Show quick M-Pesa till checkout and luxury packaging bag.`,
      call_to_action: 'Drop a comment "OOTD" or tap the WhatsApp link in bio to secure your size!',
      target_audience: 'Nairobi fashionistas, corporate stylists & weekend brunch lovers',
      suggested_audio_trend: 'Viral Kenyan Amapiano Remix',
      target_product_name: customProduct,
      projected_views: '18k - 35k views',
      status: 'approved',
      curation_state: 'selected',
    });
    setShowCustomModal(false);
    setActiveTab('elected');
  };

  const getPlatformBadge = (plat: ContentPlatform) => {
    switch (plat) {
      case 'tiktok_reels':
        return {
          label: 'TikTok & Reels',
          color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
          icon: <Video className="w-3 h-3 text-pink-400" />,
        };
      case 'whatsapp_status':
        return {
          label: 'WhatsApp Status',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <MessageSquare className="w-3 h-3 text-emerald-400" />,
        };
      case 'instagram_carousel':
        return {
          label: 'IG Carousel',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          icon: <Film className="w-3 h-3 text-purple-400" />,
        };
      case 'sms_drop':
        return {
          label: 'SMS / Direct Drop',
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          icon: <Radio className="w-3 h-3 text-cyan-400" />,
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> ANNA OS VIRAL ENGINE
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-[11px] font-mono text-neutral-400">Inventory-Tied Media</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <span>Marketing &amp; Social Content Wall</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Click to generate daily options based on stagnant stock &amp; high-margin accessories. Elect the winners, discard the rest.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateDaily}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Synthesizing Options...' : 'Generate Daily Content'}</span>
          </button>

          <button
            onClick={() => setShowCustomModal(true)}
            className="px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Custom</span>
          </button>
        </div>
      </div>

      {/* Curation Tabs: Daily Options vs Elected Posts vs Discarded */}
      <div className="flex items-center justify-between gap-3 p-1.5 bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-2xl">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-neutral-800 text-amber-400 shadow-sm border border-neutral-700/80'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Proposals</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {dailyProposals.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('elected')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'elected'
                ? 'bg-neutral-800 text-emerald-400 shadow-sm border border-neutral-700/80'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Elected Posts</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {electedPosts.length}
            </span>
          </button>

          {discardedPosts.length > 0 && (
            <button
              onClick={() => setActiveTab('discarded')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'discarded'
                  ? 'bg-neutral-800 text-neutral-300 shadow-sm border border-neutral-700/80'
                  : 'text-neutral-500 hover:text-white hover:bg-neutral-800/40'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Discarded ({discardedPosts.length})</span>
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-neutral-400 pr-2">
          <span>Targeting:</span>
          <span className="text-emerald-400 font-bold">{shop.name}</span>
        </div>
      </div>

      {/* Tab Content 1: Daily Proposals (Needs Electing or Discarding) */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {dailyProposals.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 justify-center mx-auto text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-neutral-200">Content Queue is Empty</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Anna OS evaluates your 18 stagnant Pleated Chiffon Maxi Dresses, at-risk VIP boutique clients, and trending Italian Leather Totes to suggest today's highest-converting video scripts and WhatsApp drops.
                </p>
              </div>

              <button
                onClick={handleGenerateDaily}
                disabled={isGenerating}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-lg shadow-emerald-950 inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Today's Options (Anna AI)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {dailyProposals.map((idea) => {
                const badge = getPlatformBadge(idea.platform);

                return (
                  <div
                    key={idea.id}
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-amber-500/30 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {idea.projected_views}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                        {idea.title}
                      </h3>

                      {/* Sheng / English Hook */}
                      <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-1">
                        <div className="text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>OPENING HOOK (FIRST 3 SECONDS)</span>
                        </div>
                        <p className="text-xs text-neutral-200 font-medium italic leading-relaxed">
                          "{idea.hook}"
                        </p>
                      </div>

                      {/* Script Preview */}
                      <div className="text-xs text-neutral-400 space-y-1 leading-relaxed">
                        <div className="text-[10px] font-mono text-neutral-500 uppercase">Script &amp; Visuals:</div>
                        <p className="whitespace-pre-line text-neutral-300 text-[11px] bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-900">
                          {idea.script_body}
                        </p>
                      </div>

                      {/* Audio / Trend */}
                      {idea.suggested_audio_trend && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400">
                          <Music className="w-3 h-3 text-purple-400" />
                          <span>Sound: {idea.suggested_audio_trend}</span>
                        </div>
                      )}
                    </div>

                    {/* Elect vs Discard Decision Bar */}
                    <div className="pt-3 border-t border-neutral-800/80 flex items-center gap-2">
                      <button
                        onClick={() => curateContentIdea(idea.id, 'select')}
                        className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Elect Post</span>
                      </button>

                      <button
                        onClick={() => curateContentIdea(idea.id, 'discard')}
                        className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-neutral-800 hover:border-red-500/20 transition-all cursor-pointer"
                        title="Discard option"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Elected & Active Posts */}
      {activeTab === 'elected' && (
        <div className="space-y-4">
          {electedPosts.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30">
              <CheckCircle2 className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-200">No elected posts yet</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto mt-1 mb-4">
                Head to the Daily Proposals tab and elect the scripts you want to film or broadcast.
              </p>
              <button
                onClick={() => setActiveTab('daily')}
                className="px-4 py-2 text-xs font-bold text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all cursor-pointer"
              >
                View Daily Proposals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {electedPosts.map((idea) => {
                const badge = getPlatformBadge(idea.platform);
                const isPosted = idea.status === 'posted';

                return (
                  <div
                    key={idea.id}
                    className="p-5 rounded-2xl bg-neutral-900/80 border border-emerald-500/40 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.color}`}
                        >
                          {badge.icon}
                          <span>{badge.label}</span>
                        </span>

                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                            isPosted
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isPosted ? 'LIVE POSTED' : 'ELECTED & READY'}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white">{idea.title}</h3>

                      {/* Hook */}
                      <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 space-y-1">
                        <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-emerald-400" />
                          <span>HOOK SCRIPT</span>
                        </div>
                        <p className="text-xs text-neutral-200 font-medium italic leading-relaxed">
                          "{idea.hook}"
                        </p>
                      </div>

                      {/* Full script */}
                      <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-900 text-xs text-neutral-300 space-y-1">
                        <div className="text-[10px] font-mono text-neutral-500">PRODUCTION BEATS:</div>
                        <p className="whitespace-pre-line text-[11px] leading-relaxed text-neutral-300">
                          {idea.script_body}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-300">
                        <span className="text-emerald-400 font-mono font-bold text-[10px] block">CALL TO ACTION:</span>
                        <span className="text-[11px] text-neutral-300">{idea.call_to_action}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopyScript(idea)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedId === idea.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Copy Script</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          updateContentIdeaStatus(idea.id, isPosted ? 'approved' : 'posted')
                        }
                        className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                          isPosted
                            ? 'bg-neutral-800 text-neutral-400 border-neutral-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                        }`}
                      >
                        {isPosted ? 'Mark Pending' : 'Mark as Live'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Discarded Posts */}
      {activeTab === 'discarded' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Discarded suggestions can be restored back to Daily Proposals.</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {discardedPosts.map((idea) => (
              <div
                key={idea.id}
                className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 opacity-75 hover:opacity-100 transition-opacity flex flex-col justify-between space-y-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-neutral-300">{idea.title}</h4>
                  <p className="text-[11px] text-neutral-500 italic mt-1 truncate">"{idea.hook}"</p>
                </div>

                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                  <button
                    onClick={() => curateContentIdea(idea.id, 'select')}
                    className="text-xs text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Elect this instead</span>
                  </button>

                  <span className="text-[10px] text-neutral-600 font-mono">Discarded</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Idea Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b0d13] border border-neutral-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Generate Custom Media Angle</h3>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-neutral-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">TARGET PRODUCT</label>
                <select
                  value={customProduct}
                  onChange={(e) => setCustomProduct(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (Stock: {p.stock_qty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">PLATFORM</label>
                <select
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value as ContentPlatform)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="tiktok_reels">TikTok / IG Reels (Short-form Video)</option>
                  <option value="whatsapp_status">WhatsApp Status (Direct Store Broadcast)</option>
                  <option value="instagram_carousel">Instagram Carousel (Comparison Cards)</option>
                  <option value="sms_drop">VIP SMS Flash Offer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 mb-1">VIRAL ANGLE</label>
                <input
                  type="text"
                  value={customAngle}
                  onChange={(e) => setCustomAngle(e.target.value)}
                  placeholder="e.g. Price Drop Alert, Secret Feature, Durability Test"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950"
                >
                  Create &amp; Elect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
