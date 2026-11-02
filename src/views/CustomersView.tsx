import React, { useMemo, useState } from 'react';
import {
  MessageSquare,
  Search,
  ShoppingCart,
  Sparkles,
  UserX,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Customer } from '../types';
import { WhatsAppModal } from '../components/WhatsAppModal';

export const CustomersView: React.FC = () => {
  const { customers, shop, setActiveTab } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [whatsAppModalCustomer, setWhatsAppModalCustomer] = useState<Customer | null>(null);

  const getDaysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / 86400000));
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag =
        selectedTag === 'all' ||
        (selectedTag === 'VIP' && c.tags.includes('VIP')) ||
        (selectedTag === 'At-Risk' && c.tags.includes('At-Risk'));
      return matchSearch && matchTag;
    });
  }, [customers, searchQuery, selectedTag]);

  const vipCount = customers.filter((c) => c.tags.includes('VIP')).length;
  const atRiskCount = customers.filter((c) => c.tags.includes('At-Risk')).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Customers &amp; CRM Ledger
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {customers.length} registered profiles · Automatic VIP and Churn detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{vipCount} VIPs (&gt;50k KES)</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5">
            <UserX className="w-3.5 h-3.5" />
            <span>{atRiskCount} At-Risk (&gt;30d)</span>
          </div>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          <button
            onClick={() => setSelectedTag('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              selectedTag === 'all'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All ({customers.length})
          </button>
          <button
            onClick={() => setSelectedTag('VIP')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              selectedTag === 'VIP'
                ? 'bg-amber-950/80 text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            VIP ({vipCount})
          </button>
          <button
            onClick={() => setSelectedTag('At-Risk')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              selectedTag === 'At-Risk'
                ? 'bg-rose-950/80 text-rose-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            At-Risk ({atRiskCount})
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Customer Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3 text-right">Lifetime Spend</th>
                <th className="px-5 py-3 text-center">Visits</th>
                <th className="px-5 py-3">Last Purchase</th>
                <th className="px-5 py-3">Status Tag</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredCustomers.map((c) => {
                const daysAgo = getDaysAgo(c.last_purchase_date);
                const isVIP = c.tags.includes('VIP');
                const isAtRisk = c.tags.includes('At-Risk');

                return (
                  <tr key={c.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-neutral-200">{c.name}</span>
                    </td>

                    <td className="px-5 py-3 font-mono text-neutral-400 text-[11px]">
                      {c.phone}
                    </td>

                    <td className="px-5 py-3 text-right font-mono font-bold tabular-nums">
                      <span className={isVIP ? 'text-amber-300' : 'text-neutral-200'}>
                        {shop.currency} {c.total_spent.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-5 py-3 text-center font-mono text-neutral-400 tabular-nums">
                      {c.visit_count}
                    </td>

                    <td className="px-5 py-3 text-neutral-400">
                      <span className={daysAgo > 30 ? 'text-rose-400 font-medium' : 'text-neutral-300'}>
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {isVIP && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                            VIP
                          </span>
                        )}
                        {isAtRisk && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-300">
                            At-Risk
                          </span>
                        )}
                        {!isVIP && !isAtRisk && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-400">
                            Regular
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setWhatsAppModalCustomer(c)}
                          title="Send WhatsApp Message"
                          className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setActiveTab('pos')}
                          title="Checkout in POS"
                          className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {whatsAppModalCustomer && (
        <WhatsAppModal
          insight={{
            id: `direct-cust-${whatsAppModalCustomer.id}`,
            type: whatsAppModalCustomer.tags.includes('At-Risk') ? 'vip_churn' : 'sales_strategy',
            title: `VIP Outreach to ${whatsAppModalCustomer.name}`,
            description: `Lifetime spend KES ${whatsAppModalCustomer.total_spent.toLocaleString()} across ${whatsAppModalCustomer.visit_count} visits.`,
            suggested_action: 'Send personalized loyalty voucher in Sheng/English',
            suggested_discount: 10,
            estimated_recovery_kes: whatsAppModalCustomer.total_spent,
            badge_label: whatsAppModalCustomer.tags.includes('VIP') ? 'VIP Care' : 'Re-engagement',
            affected_customers: [
              {
                id: whatsAppModalCustomer.id,
                name: whatsAppModalCustomer.name,
                phone: whatsAppModalCustomer.phone,
                total_spent: whatsAppModalCustomer.total_spent,
                days_inactive: getDaysAgo(whatsAppModalCustomer.last_purchase_date),
              },
            ],
          }}
          onClose={() => setWhatsAppModalCustomer(null)}
        />
      )}
    </div>
  );
};
