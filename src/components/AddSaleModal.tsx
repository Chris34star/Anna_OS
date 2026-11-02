import React, { useState } from 'react';
import { AlertCircle, Check, ShoppingBag, X } from 'lucide-react';
import { useStore } from '../lib/store';

interface AddSaleModalProps {
  onClose: () => void;
  preselectedProductId?: string;
  preselectedCustomerId?: string;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  onClose,
  preselectedProductId,
  preselectedCustomerId,
}) => {
  const { products, customers, addSale, addCustomer } = useStore();

  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId || products[0]?.id || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || customers[0]?.id || '');
  const [qty, setQty] = useState(1);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+254 7');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const product = products.find((p) => p.id === selectedProductId);
  const customer = customers.find((c) => c.id === selectedCustomerId);
  const totalAmount = (product?.sell_price || 0) * qty;

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      setErrorMsg('Please enter customer name and phone');
      return;
    }
    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
    });
    setSelectedCustomerId(created.id);
    setIsCreatingCustomer(false);
    setErrorMsg('');
  };

  const handleCompleteSale = () => {
    if (!selectedProductId || !selectedCustomerId) {
      setErrorMsg('Please select a product and a customer');
      return;
    }
    if (qty < 1) {
      setErrorMsg('Quantity must be at least 1');
      return;
    }

    const result = addSale(selectedProductId, selectedCustomerId, qty);
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to record transaction');
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-neutral-100">POS-Lite · Record Sale</h3>
              <p className="text-xs text-neutral-400">Instantly updates stock & customer loyalty ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Sale recorded successfully! Stock and customer metrics updated.</span>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Select Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={isSuccess}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — KES {p.sell_price.toLocaleString()} ({p.stock_qty} in stock)
                </option>
              ))}
            </select>
            {product && (
              <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500">
                <span>SKU: {product.sku}</span>
                <span className={product.stock_qty < 5 ? 'text-amber-400 font-medium' : 'text-neutral-400'}>
                  Available: {product.stock_qty} units
                </span>
              </div>
            )}
          </div>

          {/* Customer Selection or Quick Create */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Customer (Phone / M-Pesa)
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                {isCreatingCustomer ? '← Choose Existing' : '+ New Customer'}
              </button>
            </div>

            {isCreatingCustomer ? (
              <form onSubmit={handleCreateNewCustomer} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                <input
                  type="text"
                  placeholder="Customer Full Name (e.g. Victor Mutua)"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="M-Pesa Phone (e.g. +254 712 345 678)"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg transition-colors"
                >
                  Save & Select Customer
                </button>
              </form>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                disabled={isSuccess}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-hidden focus:border-emerald-500 transition-colors"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.tags.includes('VIP') ? '★ VIP' : ''}
                  </option>
                ))}
              </select>
            )}
            {customer && !isCreatingCustomer && (
              <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500">
                <span>Lifetime Spend: KES {customer.total_spent.toLocaleString()}</span>
                <span>{customer.visit_count} past visits</span>
              </div>
            )}
          </div>

          {/* Quantity & Summary */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={product ? Math.max(1, product.stock_qty) : 10}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={isSuccess}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-200 font-mono tabular-nums focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-2.5 flex flex-col justify-center">
              <span className="text-[11px] text-neutral-400">Total Due (KES)</span>
              <span className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                KES {totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCompleteSale}
            disabled={isSuccess || !product || product.stock_qty < qty}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
};
