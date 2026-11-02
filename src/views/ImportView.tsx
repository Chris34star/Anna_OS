import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FolderUp,
  Sparkles,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '../lib/store';
import { DemoSeeder } from '../components/Wiring';
import { Product, Sale } from '../types';

export const ImportView: React.FC = () => {
  const { seedDemoData, isSeeding, importExcelData, products, customers, sales, setActiveTab } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [importSummary, setImportSummary] = useState<{ products: number; sales: number } | null>(null);
  const [errorText, setErrorText] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('parsing');
    setErrorText('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });

        const parsedProducts: Partial<Product>[] = [];
        const parsedSales: Partial<Sale>[] = [];

        const sheetNames = workbook.SheetNames;
        const prodSheetName = sheetNames.find((s) => s.toLowerCase().includes('product')) || sheetNames[0];

        if (prodSheetName) {
          const rawProds: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[prodSheetName]);
          for (const row of rawProds) {
            parsedProducts.push({
              name: row.Name || row.name || row.Product || row.title || 'Imported Boutique Item',
              sku: row.SKU || row.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
              category: row.Category || row.category || 'Dresses & Gowns',
              buy_price: Number(row.BuyPrice || row.buy_price || row.Cost || 2500),
              sell_price: Number(row.SellPrice || row.sell_price || row.Price || 4500),
              stock_qty: Number(row.Stock || row.stock_qty || row.Qty || 10),
              custom_fields: {
                size: String(row.Size || row.size || 'M'),
                color: String(row.Color || row.color || 'Midnight Black'),
                material: String(row.Material || row.material || 'Silk Chiffon'),
              },
            });
          }
        }

        const salesSheetName = sheetNames.find((s) => s.toLowerCase().includes('sale'));
        if (salesSheetName) {
          const rawSales: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[salesSheetName]);
          for (const row of rawSales) {
            parsedSales.push({
              qty: Number(row.Qty || row.qty || 1),
              total: Number(row.Total || row.total || 4500),
              date: row.Date || row.date || new Date().toISOString().split('T')[0],
              product_name: row.Product || row.product_name || 'Boutique Sale',
              customer_name: row.Customer || row.customer_name || 'Walk-in Client',
            });
          }
        }

        if (parsedProducts.length === 0 && parsedSales.length === 0) {
          throw new Error('No valid product or sales rows found in workbook.');
        }

        importExcelData(parsedProducts, parsedSales);
        setImportSummary({ products: parsedProducts.length, sales: parsedSales.length });
        setImportStatus('success');
      } catch (err: any) {
        setImportStatus('error');
        setErrorText(err?.message || 'Failed to parse Excel file.');
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const sampleProducts = [
      {
        Name: 'Pleated Chiffon Floral Maxi Dress',
        SKU: 'BTQ-CHIFF-01',
        Category: 'Dresses & Gowns',
        BuyPrice: 2200,
        SellPrice: 4500,
        Stock: 18,
        Size: 'M',
        Color: 'Emerald Green',
        Material: 'Chiffon',
      },
      {
        Name: 'Chunky Lug-Sole Chelsea Boots',
        SKU: 'BTQ-BOOT-02',
        Category: 'Footwear & Boots',
        BuyPrice: 3500,
        SellPrice: 6000,
        Stock: 15,
        Size: 'EU 39',
        Color: 'Matte Black',
        Material: 'Full-Grain Leather',
      },
      {
        Name: 'Italian Vegan Leather Crossbody Tote',
        SKU: 'BTQ-BAG-03',
        Category: 'Handbags & Totes',
        BuyPrice: 1800,
        SellPrice: 3200,
        Stock: 25,
        Size: 'Standard',
        Color: 'Cognac Brown',
        Material: 'Vegan Leather',
      },
    ];

    const sampleSales = [
      {
        Product: 'Pleated Chiffon Floral Maxi Dress',
        Customer: 'Brian Kipchoge',
        Qty: 1,
        Total: 4500,
        Date: '2026-10-15',
      },
      {
        Product: 'Chunky Lug-Sole Chelsea Boots',
        Customer: 'Faith Mwangi',
        Qty: 1,
        Total: 6000,
        Date: '2026-10-18',
      },
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleProducts), 'Products');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sampleSales), 'Sales');
    XLSX.writeFile(wb, 'anna_os_boutique_template.xlsx');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Data Ingestion &amp; Seeder
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Fixed Postgres schema · Zero table migrations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Option 1: Demo Seeder */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">1-Click Demo Data</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Populates 50 products, 100 Kenyan customers, and 200 sales spanning 90 days.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-neutral-300">
                <span>Products:</span> <strong className="text-emerald-400">50 Items</strong>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Customers:</span> <strong className="text-emerald-400">100 Profiles</strong>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Sales:</span> <strong className="text-emerald-400">200 Records</strong>
              </div>
            </div>
          </div>

          <button
            onClick={seedDemoData}
            disabled={isSeeding}
            className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Seeding Database...' : 'Seed Demo Data'}</span>
          </button>
          <div className="pt-1"><DemoSeeder /></div>
        </div>

        {/* Option 2: Excel Upload */}
        <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Upload Spreadsheet (.xlsx)</h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Import custom inventory and sales via xlsx parser.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-neutral-700 hover:border-emerald-500/60 rounded-xl p-4 text-center cursor-pointer transition-colors bg-neutral-950/40"
            >
              <FolderUp className="w-6 h-6 text-neutral-400 mx-auto mb-1.5" />
              <span className="text-xs font-medium text-neutral-200 block">
                Click to browse .xlsx or .csv
              </span>
            </div>

            {importStatus === 'success' && importSummary && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-center justify-between">
                <span>
                  Imported {importSummary.products} items &amp; {importSummary.sales} sales!
                </span>
                <button onClick={() => setActiveTab('pos')} className="underline font-bold">
                  Open POS →
                </button>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorText}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select File</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="py-2.5 px-3 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-950 border border-neutral-800 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
              title="Download sample template (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Table Metrics */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
        <div>Product Table: <strong className="text-white">{products.length}</strong></div>
        <div>Customer Table: <strong className="text-white">{customers.length}</strong></div>
        <div>Sale Table: <strong className="text-white">{sales.length}</strong></div>
        <div className="text-emerald-400 font-bold">Schema Status: Active</div>
      </div>
    </div>
  );
};
