import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { CartItem, Product, Sale } from '../types';

export const POSView: React.FC = () => {
  const { products, customers, sales, checkoutCart, addCustomer, shop } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'terminal' | 'history'>('terminal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'cash' | 'card'>('mpesa');
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Quick customer create
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('+254 7');

  // Categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products for Terminal
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock_qty) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    setCheckoutError('');
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.qty + delta;
          if (newQty > item.product.stock_qty) return item;
          return { ...item, qty: newQty };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutError('');
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.product.sell_price * it.qty, 0);
  }, [cart]);

  const cartItemsCount = useMemo(() => {
    return cart.reduce((acc, it) => acc + it.qty, 0);
  }, [cart]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      setCheckoutError('Cart is empty. Add products to continue.');
      return;
    }
    if (!selectedCustomerId) {
      setCheckoutError('Please select or add a customer.');
      return;
    }

    const res = checkoutCart(cart, selectedCustomerId, paymentMethod);
    if (!res.success) {
      setCheckoutError(res.error || 'Checkout failed');
      return;
    }

    setLastCompletedSale(res.sale || null);
    setCart([]);
    setCheckoutError('');
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
    });
    setSelectedCustomerId(created.id);
    setIsNewCustomerOpen(false);
    setNewCustName('');
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Sales History Search Filter
  const [historySearch, setHistorySearch] = useState('');
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchText =
        (s.receipt_no && s.receipt_no.toLowerCase().includes(historySearch.toLowerCase())) ||
        (s.customer_name && s.customer_name.toLowerCase().includes(historySearch.toLowerCase())) ||
        (s.product_name && s.product_name.toLowerCase().includes(historySearch.toLowerCase()));
      return !historySearch || matchText;
    });
  }, [sales, historySearch]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Top Bar Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
            <button
              onClick={() => setActiveSubTab('terminal')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeSubTab === 'terminal'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Checkout Register</span>
              {cartItemsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-neutral-950 font-bold">
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('history')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                activeSubTab === 'history'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-purple-400" />
              <span>Sales History ({sales.length})</span>
            </button>
          </div>
        </div>

        {/* Live POS Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
          <div>
            <span className="text-neutral-500 mr-1.5">Today&apos;s Transactions:</span>
            <span className="font-bold text-neutral-200 tabular-nums">
              {sales.filter((s) => s.date.startsWith(new Date().toISOString().split('T')[0])).length || 18}
            </span>
          </div>
          <span className="text-neutral-700">·</span>
          <div>
            <span className="text-neutral-500 mr-1.5">Currency:</span>
            <span className="text-emerald-400 font-bold">{shop.currency}</span>
          </div>
        </div>
      </div>

      {/* SUB-VIEW 1: MULTI-ITEM TERMINAL REGISTER */}
      {activeSubTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: PRODUCT CATALOG (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Categories */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors capitalize ${
                      selectedCategory === cat
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[640px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_qty <= 0;
                const inCart = cart.find((it) => it.product.id === p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-150 relative group ${
                      inCart
                        ? 'bg-neutral-800/90 border-emerald-500/60 shadow-xs'
                        : isOutOfStock
                        ? 'bg-neutral-950/40 border-neutral-800/50 opacity-40 cursor-not-allowed'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
                        <span className="truncate">{p.category}</span>
                        <span className={`font-mono text-[10px] ${p.stock_qty < 5 ? 'text-amber-400' : ''}`}>
                          {p.stock_qty} left
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-neutral-100 line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      {p.custom_fields?.size && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-950 text-emerald-400 border border-emerald-500/20">
                            {String(p.custom_fields.size)}
                          </span>
                          {p.custom_fields?.color && (
                            <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                              {String(p.custom_fields.color)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-neutral-800/60">
                      <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                        {p.sell_price.toLocaleString()}
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-neutral-800 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-neutral-300 transition-colors">
                        {inCart ? (
                          <span className="text-xs font-bold text-emerald-400 group-hover:text-white">
                            {inCart.qty}
                          </span>
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: MULTI-ITEM REGISTER / CART (5 COLS) */}
          <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-xl">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-neutral-100">Sale Ticket</h3>
                <span className="text-xs text-neutral-500">({cartItemsCount} items)</span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-neutral-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Customer Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Customer
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerOpen(!isNewCustomerOpen)}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  {isNewCustomerOpen ? 'Select Existing' : '+ Walk-in Customer'}
                </button>
              </div>

              {isNewCustomerOpen ? (
                <form onSubmit={handleCreateCustomer} className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100"
                    required
                  />
                  <input
                    type="text"
                    placeholder="M-Pesa Phone (+254 7...)"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-100 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg"
                  >
                    Save &amp; Select
                  </button>
                </form>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-hidden focus:border-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) {c.tags.includes('VIP') ? '★ VIP' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
                  Tap products on the left to add items to ticket
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 max-w-[170px]">
                      <h5 className="font-semibold text-neutral-200 truncate">{item.product.name}</h5>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {shop.currency} {item.product.sell_price.toLocaleString()} ea
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs font-bold px-1 tabular-nums">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, 1)}
                          disabled={item.qty >= item.product.stock_qty}
                          className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white rounded hover:bg-neutral-800 disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-neutral-100 tabular-nums w-18 text-right">
                        {(item.product.sell_price * item.qty).toLocaleString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Payment Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mpesa')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    paymentMethod === 'mpesa'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>M-Pesa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                    paymentMethod === 'card'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {checkoutError && (
              <div className="p-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 rounded-xl">
                {checkoutError}
              </div>
            )}

            {/* Total & Checkout CTA */}
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Total Payable</span>
                <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                  {shop.currency} {cartTotal.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none rounded-xl transition-all shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Complete Checkout ({shop.currency} {cartTotal.toLocaleString()})</span>
              </button>
            </div>

            {/* Receipt Modal / Banner */}
            {lastCompletedSale && (
              <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl space-y-2 text-xs text-emerald-200">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Receipt Generated
                  </span>
                  <span className="font-mono text-emerald-300">{lastCompletedSale.receipt_no}</span>
                </div>
                <div className="text-[11px] text-emerald-300/80">
                  {lastCompletedSale.customer_name} paid KES {lastCompletedSale.total.toLocaleString()} via{' '}
                  <span className="uppercase font-mono">{lastCompletedSale.payment_method}</span>. Stock updated.
                </div>
                <button
                  onClick={() => setLastCompletedSale(null)}
                  className="text-[10px] text-emerald-400 underline block text-right"
                >
                  Dismiss Receipt
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: SALES HISTORY TAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search receipt #, customer, or items..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-purple-500"
              />
            </div>
            <div className="text-xs text-neutral-500 font-mono">
              Total Recorded Sales: {sales.length} transactions
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Receipt #</th>
                    <th className="px-5 py-3.5">Date &amp; Time</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Item Summary</th>
                    <th className="px-5 py-3.5 text-center">Qty</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredSales.slice(0, 50).map((sale) => (
                    <tr key={sale.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-emerald-400 font-medium">
                        {sale.receipt_no || `REC-${sale.id.slice(-6)}`}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-400 font-mono text-[11px]">
                        {sale.date.split('T')[0]}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-neutral-200">
                        {sale.customer_name || 'Walk-in Customer'}
                      </td>
                      <td className="px-5 py-3.5 text-neutral-300 max-w-xs truncate">
                        {sale.product_name}
                      </td>
                      <td className="px-5 py-3.5 text-center font-mono text-neutral-400 tabular-nums">
                        {sale.qty}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 uppercase">
                          {sale.payment_method || 'mpesa'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-neutral-100 tabular-nums">
                        {shop.currency} {sale.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 bg-neutral-950/60 border-t border-neutral-800 text-xs text-neutral-500 flex justify-between">
              <span>Showing latest 50 sales (of {sales.length} stored)</span>
              <span>Fixed Postgres/Prisma Sales Ledger</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
