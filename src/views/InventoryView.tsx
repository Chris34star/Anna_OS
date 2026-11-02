import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Minus,
  Package,
  Plus,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
} from 'lucide-react';
import { useStore } from '../lib/store';
import { Product } from '../types';

export const InventoryView: React.FC = () => {
  const { products, shop, addProduct, updateProductStock, setActiveTab } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Add Product form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Dresses & Gowns');
  const [buyPrice, setBuyPrice] = useState(2500);
  const [sellPrice, setSellPrice] = useState(4500);
  const [stockQty, setStockQty] = useState(12);
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Emerald Green');
  const [material, setMaterial] = useState('Chiffon Silk');

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addProduct({
      name: name.trim(),
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      category,
      buy_price: buyPrice,
      sell_price: sellPrice,
      stock_qty: stockQty,
      custom_fields: {
        size,
        color,
        material,
      },
    });

    setShowAddProductModal(false);
    setName('');
  };

  const deadStockCount = products.filter((p) => p.id === 'prod-dead-01' || p.id === 'prod-dead-02').length;
  const lowStockCount = products.filter((p) => p.stock_qty <= 3).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Boutique Inventory &amp; Apparel Stock</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {products.length} live boutique SKUs with size/color variants · {shop.name}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-xl hover:bg-emerald-900/60 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open POS Register</span>
          </button>

          <button
            onClick={() => setShowAddProductModal(true)}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 rounded-xl transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Boutique Item</span>
          </button>
        </div>
      </div>

      {/* KPI Chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-neutral-300 tabular-nums">
          Total Boutique SKUs: <strong className="text-white">{products.length}</strong>
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/40 font-mono text-amber-300 tabular-nums">
          Dead Stock: <strong>18 Chiffon Maxi Dresses (&gt;45d)</strong>
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 font-mono text-neutral-300 tabular-nums">
          Low Stock (&le;3 units): <strong>{lowStockCount} items</strong>
        </span>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dresses, boots, bags or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors capitalize cursor-pointer ${
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

      {/* Inventory Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 text-neutral-400 font-semibold border-b border-neutral-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Product &amp; SKU</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Cost (KES)</th>
                <th className="px-5 py-3 text-right">Price (KES)</th>
                <th className="px-5 py-3 text-center">Stock</th>
                <th className="px-5 py-3">Size &amp; Variant</th>
                <th className="px-5 py-3 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredProducts.map((p) => {
                const isDeadStock = p.id === 'prod-dead-01' || p.id === 'prod-dead-02';
                const isLowStock = p.stock_qty <= 3;

                return (
                  <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-neutral-200 flex items-center gap-2">
                        <span>{p.name}</span>
                        {isDeadStock && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-800/40 text-amber-300">
                            DEAD STOCK (45d)
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-neutral-500">{p.sku}</span>
                    </td>

                    <td className="px-5 py-3 text-neutral-400">{p.category}</td>

                    <td className="px-5 py-3 text-right font-mono text-neutral-400 tabular-nums">
                      {p.buy_price.toLocaleString()}
                    </td>

                    <td className="px-5 py-3 text-right font-mono font-bold text-emerald-400 tabular-nums">
                      {p.sell_price.toLocaleString()}
                    </td>

                    <td className="px-5 py-3 text-center">
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded tabular-nums ${
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

                    <td className="px-5 py-3 text-neutral-400">
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono text-[10px]">
                          {String(p.custom_fields?.size || 'Free Size')}
                        </span>
                        {p.custom_fields?.color && (
                          <span className="text-neutral-400 text-[10px]">
                            {String(p.custom_fields.color)}
                          </span>
                        )}
                        {p.custom_fields?.material && (
                          <span className="text-neutral-500 text-[10px] hidden lg:inline">
                            · {String(p.custom_fields.material)}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateProductStock(p.id, p.stock_qty - 1)}
                          className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-xs px-1 text-neutral-200">{p.stock_qty}</span>
                        <button
                          type="button"
                          onClick={() => updateProductStock(p.id, p.stock_qty + 1)}
                          className="w-5 h-5 flex items-center justify-center text-neutral-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
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

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" /> Add Boutique Item
            </h3>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-400 mb-1">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. Pleated Chiffon Floral Maxi Dress"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                  <label className="block text-neutral-400 mb-1">Cost (KES)</label>
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Sell Price (KES)</label>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-neutral-400 mb-1">Size</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="M, EU 38"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Emerald"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(parseInt(e.target.value) || 0)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-neutral-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Material / Fabric</label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Chiffon, Silk, Leather"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-neutral-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3.5 py-2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer shadow-md shadow-emerald-950"
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
