import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Package,
  Plus,
  Search,
  Shield,
  ShoppingBag,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Product } from '../types';

interface ProductsViewProps {
  onOpenAddSaleWithProduct?: (productId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ onOpenAddSaleWithProduct }) => {
  const { products, shop, addProduct } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Dresses & Gowns');
  const [newProdBuy, setNewProdBuy] = useState(2500);
  const [newProdSell, setNewProdSell] = useState(4500);
  const [newProdStock, setNewProdStock] = useState(12);
  const [newProdWarranty, setNewProdWarranty] = useState(12);
  const [newProdSerial, setNewProdSerial] = useState('M');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    addProduct({
      name: newProdName.trim(),
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      category: newProdCategory,
      buy_price: newProdBuy,
      sell_price: newProdSell,
      stock_qty: newProdStock,
      custom_fields: {
        warranty_months: newProdWarranty,
        serial_no: newProdSerial,
      },
    });

    setShowAddProductModal(false);
    setNewProdName('');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Inventory &amp; POS-Lite
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time stock ledger with warranty tracking and fast one-click POS checkout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, brand, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors capitalize ${
                selectedCategory === cat
                  ? 'bg-neutral-800 text-white font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat === 'all' ? 'All Inventory' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Product &amp; SKU</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5 text-right">Buy Price</th>
                <th className="px-5 py-3.5 text-right">Sell Price</th>
                <th className="px-5 py-3.5 text-center">Stock Qty</th>
                <th className="px-5 py-3.5">Warranty &amp; Custom</th>
                <th className="px-5 py-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-500">
                    No products found matching &ldquo;{searchQuery}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isDeadStock = p.id === 'prod-dead-01';
                  const isLowStock = p.stock_qty <= 3;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-neutral-800/40 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-neutral-200 group-hover:text-white flex items-center gap-2">
                              <span>{p.name}</span>
                              {isDeadStock && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800/40 text-amber-300">
                                  DEAD STOCK (45d)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-neutral-500">
                              {p.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-neutral-400">
                        {p.category}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-neutral-400 tabular-nums">
                        {shop.currency} {p.buy_price.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400 tabular-nums">
                        {shop.currency} {p.sell_price.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs tabular-nums ${
                            p.stock_qty === 0
                              ? 'bg-rose-950 text-rose-300'
                              : isLowStock
                              ? 'bg-amber-950/80 text-amber-300'
                              : 'bg-neutral-800 text-neutral-200'
                          }`}
                        >
                          {p.stock_qty}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-neutral-400">
                        <div className="flex items-center gap-2 text-[11px]">
                          {p.custom_fields?.warranty_months !== undefined && (
                            <span className="flex items-center gap-1 text-neutral-300">
                              <Shield className="w-3 h-3 text-neutral-500" />
                              {p.custom_fields.warranty_months} Mo Warranty
                            </span>
                          )}
                          {p.custom_fields?.serial_no && (
                            <span className="font-mono text-neutral-500 text-[10px]">
                              {p.custom_fields.serial_no}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onOpenAddSaleWithProduct?.(p.id)}
                          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-emerald-600/90 hover:bg-emerald-500 rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>Sell</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-3 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <span>Showing {filteredProducts.length} of {products.length} catalog items</span>
          <span>Fixed Schema · Products &amp; Sales Tables</span>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" /> Add New Boutique Item
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Pleated Chiffon Floral Maxi Dress"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Category</label>
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-200"
                >
                  <option value="Dresses & Gowns">Dresses &amp; Gowns</option>
                  <option value="Footwear & Boots">Footwear &amp; Boots</option>
                  <option value="Denim & Outerwear">Denim &amp; Outerwear</option>
                  <option value="Handbags & Totes">Handbags &amp; Totes</option>
                  <option value="Accessories & Jewelry">Accessories &amp; Jewelry</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Buy Price (KES)</label>
                  <input
                    type="number"
                    value={newProdBuy}
                    onChange={(e) => setNewProdBuy(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Sell Price (KES)</label>
                  <input
                    type="number"
                    value={newProdSell}
                    onChange={(e) => setNewProdSell(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Warranty (Months)</label>
                  <input
                    type="number"
                    value={newProdWarranty}
                    onChange={(e) => setNewProdWarranty(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3.5 py-2 text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
