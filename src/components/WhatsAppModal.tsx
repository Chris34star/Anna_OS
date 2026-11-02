import React, { useState } from 'react';
import { Check, CheckCheck, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { BusinessInsight } from '../types';
import { useStore } from '../lib/store';
import { generateWhatsAppDraft } from '../lib/llama';

interface WhatsAppModalProps {
  insight: BusinessInsight;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ insight, onClose }) => {
  const { customers, addTask, updateInsightStatus } = useStore();

  // Targets: if churn insight, pick the 8 at-risk VIPs; else pick customers who bought similar or top 10
  const recipients =
    insight.type === 'vip_churn'
      ? customers.filter((c) => c.tags.includes('VIP') && c.tags.includes('At-Risk')).slice(0, 8)
      : customers.slice(0, 12);

  const [messageBody, setMessageBody] = useState<string>(() => {
    const firstName = recipients[0]?.name.split(' ')[0] || 'Customer';
    if (insight.type === 'vip_churn') {
      return `Niaje ${firstName}! 👋 Ni Brian kutoka Amani Luxe Boutique. Tumekumiss sana shop! As one of our top VIP fashionistas, we've set aside a KES 2,500 voucher on your next purchase of evening dresses, designer heels, or luxury totes this week. Plus get a complimentary private champagne fitting session. Tumekuwekea kando, pass by our boutique on Mama Ngina St or reply here to reserve your look! Karibu sana. 🇰🇪✨`;
    } else if (insight.type === 'dead_stock') {
      return `Sasa ${firstName}! 🔥 Exclusive flash drop at Amani Luxe: We have a limited 15% clearance discount on original Pleated Chiffon Floral Maxi Dresses (sizes XS to XL), now down to KES 3,825! Only 18 pieces left for our trusted buyers. Reply "SECURE" with your size to hold yours before stock clears out today! 👗⚡`;
    } else {
      return `Habari ${firstName}! 👠 Special OOTD styling deal at Amani Luxe Boutique: Grab any cocktail dress or blazer today and get our Vegan Leather Crossbody Bag or metallic clutch for just KES 1,999 (save KES 1,500)! Pass by our boutique or reply to order via M-Pesa courier delivery. Have a fabulous week! 💖✨`;
    }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [deliveredCount, setDeliveredCount] = useState(0);

  const handleRegenerate = async (tone: 'sheng' | 'english' | 'urgent') => {
    setIsGenerating(true);
    try {
      const draft = await generateWhatsAppDraft(insight, recipients[0]?.name.split(' ')[0] || 'Valued Buyer');
      if (tone === 'english') {
        setMessageBody(
          `Hello ${recipients[0]?.name.split(' ')[0] || 'there'}, Amani Luxe Boutique appreciates your loyalty! Please enjoy an exclusive KES 2,500 discount on your next visit this week. Present this WhatsApp message at our counter on Mama Ngina Street.`
        );
      } else if (tone === 'urgent') {
        setMessageBody(
          `FLASH OFFER: Only 24 hours left! ${recipients[0]?.name.split(' ')[0] || 'VIP Member'}, claim your KES 2,500 Amani Luxe Boutique voucher today. Limited to the first 10 customers. Reply CLAIM now!`
        );
      } else {
        setMessageBody(draft);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendBroadcast = async () => {
    setSendStatus('sending');
    setDeliveredCount(0);

    // Simulate WhatsApp Cloud API batch sending with realistic progression
    for (let i = 1; i <= recipients.length; i++) {
      await new Promise((r) => setTimeout(r, 180));
      setDeliveredCount(i);
    }

    setSendStatus('sent');

    // Create completed task in Action Wall
    addTask({
      assigned_role: 'Floor Cashier',
      title: `WhatsApp Broadcast Sent: ${insight.title}`,
      description: `Dispatched Sheng/English offer via WhatsApp Cloud API to ${recipients.length} customers (${recipients.map((r) => r.name).join(', ')}).`,
      status: 'done',
      ai_suggestion: {
        insight_type: insight.type,
        source: 'Llama 3 Business Analyzer + WhatsApp Cloud API',
        potential_impact_kes: insight.estimated_recovery_kes,
      },
    });

    updateInsightStatus(insight.id, 'approved_whatsapp');

    // Auto-close after 2.5s showing success
    setTimeout(() => {
      onClose();
    }, 2400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with WhatsApp Business Branding */}
        <div className="bg-[#075E54] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold shadow-inner">
              <MessageSquare className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base leading-tight">Amani Luxe Boutique (Official)</h3>
                <span className="bg-emerald-400 text-emerald-950 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Check className="w-3 h-3 stroke-[3]" /> VERIFIED
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">WhatsApp Cloud API · Graph API v18.0</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Campaign Context */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
              <span>Target Strategy: {insight.badge_label}</span>
              <span className="font-mono text-emerald-400 tabular-nums">
                KES {insight.estimated_recovery_kes?.toLocaleString()} Target
              </span>
            </div>
            <p className="text-sm font-medium text-neutral-200">{insight.title}</p>
          </div>

          {/* Recipients Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Target Recipients ({recipients.length} Customers)
              </label>
              <span className="text-xs text-neutral-500">Filtered by AI criteria</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-neutral-950 border border-neutral-800/80 rounded-xl">
              {recipients.map((c) => (
                <div
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 text-xs text-neutral-200"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-[11px] font-mono text-neutral-400">{c.phone}</span>
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp Message Editor & Tone Quick Switchers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> AI Sheng/English Message
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleRegenerate('sheng')}
                  disabled={isGenerating || sendStatus !== 'idle'}
                  className="px-2.5 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  Sheng Mix
                </button>
                <button
                  type="button"
                  onClick={() => handleRegenerate('english')}
                  disabled={isGenerating || sendStatus !== 'idle'}
                  className="px-2.5 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  Formal English
                </button>
                <button
                  type="button"
                  onClick={() => handleRegenerate('urgent')}
                  disabled={isGenerating || sendStatus !== 'idle'}
                  className="px-2.5 py-1 text-xs rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  Flash 24h
                </button>
              </div>
            </div>

            {/* Chat Bubble Mockup */}
            <div className="p-4 rounded-xl bg-[#0b141a] border border-neutral-800 relative">
              <div className="max-w-[85%] bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-xs shadow-sm space-y-2">
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  disabled={sendStatus !== 'idle'}
                  rows={4}
                  className="w-full bg-transparent text-sm text-neutral-100 placeholder-emerald-200/50 resize-none focus:outline-hidden"
                />
                <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-200/70 select-none">
                  <span>Just now</span>
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                </div>
              </div>
            </div>
          </div>

          {/* Sending Progress Display */}
          {sendStatus !== 'idle' && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-emerald-300 flex items-center gap-2">
                  {sendStatus === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      Dispatching via WhatsApp Cloud API webhook...
                    </>
                  ) : (
                    <>
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                      Broadcast Successfully Delivered!
                    </>
                  )}
                </span>
                <span className="font-mono text-emerald-200 tabular-nums">
                  {deliveredCount} / {recipients.length} Sent
                </span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${(deliveredCount / recipients.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-400">
            Powered by <span className="text-neutral-200 font-semibold">Llama 3</span> +{' '}
            <span className="text-emerald-400 font-semibold">Meta WhatsApp Cloud API</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={sendStatus === 'sending'}
              className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendBroadcast}
              disabled={sendStatus !== 'idle' || !messageBody.trim()}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-lg shadow-[#25D366]/20 flex items-center gap-2"
            >
              {sendStatus === 'sending' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : sendStatus === 'sent' ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  Sent to {recipients.length} Customers!
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Broadcast ({recipients.length} WhatsApps)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
