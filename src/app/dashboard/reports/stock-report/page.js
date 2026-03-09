'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/dashboard-layout';
import {
  ArrowLeft, Printer, RefreshCw, AlertTriangle,
  Package, CheckCircle, XCircle, Search, X, Filter
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

function getStatus(qty, min) {
  const q = parseFloat(qty) || 0;
  const m = parseFloat(min) || 0;
  if (q <= 0)               return { label: 'Out of Stock', cls: 'text-red-600 bg-red-50 border-red-200' };
  if (m > 0 && q <= m)      return { label: 'Low Stock',    cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  return                           { label: 'In Stock',     cls: 'text-green-700 bg-green-50 border-green-200' };
}

function fmt(n) {
  return parseFloat(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ─── component ──────────────────────────────────────────────────────────────

export default function StockReportPage() {
  const router = useRouter();

  const [allStock, setAllStock]       = useState([]);
  const [stores, setStores]           = useState([]);
  const [loading, setLoading]         = useState(true);

  // filters
  const [search, setSearch]           = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterCat, setFilterCat]     = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '' | 'low_stock' | 'out_of_stock' | 'in_stock'

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stockRes, storeRes] = await Promise.all([
        fetch('/api/store-stock'),
        fetch('/api/stores'),
      ]);

      if (storeRes.ok) {
        const d = await storeRes.json();
        setStores(d.data || d || []);
      }

      if (stockRes.ok) {
        const data = await stockRes.json();
        const flat = [];
        if (Array.isArray(data)) {
          data.forEach(store => {
            (store.store_stocks || []).forEach(s => {
              flat.push({ ...s, store: { storeid: store.storeid, store_name: store.store_name } });
            });
          });
        }
        setAllStock(flat);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const categories = useMemo(() => {
    const s = new Set(allStock.map(i => i.product?.cat_name).filter(Boolean));
    return [...s].sort();
  }, [allStock]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allStock.filter(item => {
      const matchSearch = !q ||
        item.product?.pro_title?.toLowerCase().includes(q) ||
        item.product?.cat_name?.toLowerCase().includes(q);
      const matchStore  = !filterStore || item.store?.storeid?.toString() === filterStore;
      const matchCat    = !filterCat   || item.product?.cat_name === filterCat;

      const qty = parseFloat(item.stock_quantity) || 0;
      const min = parseFloat(item.min_stock) || 0;
      let matchStatus = true;
      if      (filterStatus === 'out_of_stock') matchStatus = qty <= 0;
      else if (filterStatus === 'low_stock')    matchStatus = qty > 0 && min > 0 && qty <= min;
      else if (filterStatus === 'in_stock')     matchStatus = min > 0 ? qty > min : qty > 0;

      return matchSearch && matchStore && matchCat && matchStatus;
    });
  }, [allStock, search, filterStore, filterCat, filterStatus]);

  const stats = useMemo(() => {
    let inStock = 0, lowStock = 0, outOfStock = 0, totalValue = 0;
    filtered.forEach(item => {
      const qty  = parseFloat(item.stock_quantity) || 0;
      const min  = parseFloat(item.min_stock) || 0;
      const cost = parseFloat(item.product?.pro_cost_price) || 0;
      totalValue += qty * cost;
      const s = getStatus(qty, min);
      if (s.label === 'In Stock')     inStock++;
      else if (s.label === 'Low Stock') lowStock++;
      else                              outOfStock++;
    });
    return { total: filtered.length, inStock, lowStock, outOfStock, totalValue };
  }, [filtered]);

  const clearFilters = () => {
    setSearch(''); setFilterStore(''); setFilterCat(''); setFilterStatus('');
  };

  // ── print ─────────────────────────────────────────────────────────────────

  const handlePrint = () => {
    const storeName = filterStore
      ? stores.find(s => s.storeid?.toString() === filterStore)?.store_name || 'All Stores'
      : 'All Stores';

    const statusLabel = {
      '': 'All Items',
      low_stock:    'Low Stock Only',
      out_of_stock: 'Out of Stock Only',
      in_stock:     'In Stock Only',
    }[filterStatus];

    const now     = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const rows = filtered.map((item, i) => {
      const qty    = parseFloat(item.stock_quantity) || 0;
      const min    = parseFloat(item.min_stock) || 0;
      const cost   = parseFloat(item.product?.pro_cost_price) || 0;
      const value  = qty * cost;
      const status = getStatus(qty, min);
      const color  = status.label === 'Out of Stock' ? '#dc2626'
                   : status.label === 'Low Stock'    ? '#d97706'
                   :                                   '#16a34a';
      const bg     = i % 2 === 0 ? '#fff' : '#f9fafb';
      return `
        <tr style="background:${bg};">
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;font-weight:600;">${item.product?.pro_title || 'N/A'}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;">${item.product?.cat_name || '—'}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;">${item.store?.store_name || 'N/A'}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;">${item.product?.pro_unit || '—'}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;font-weight:700;text-align:right;">${qty}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;">${min > 0 ? min : '—'}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;color:${color};font-weight:600;">${status.label}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;text-align:right;">${cost > 0 ? 'Rs ' + fmt(cost) : '—'}</td>
          <td style="padding:5px 6px;font-size:10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${cost > 0 ? 'Rs ' + fmt(value) : '—'}</td>
        </tr>`;
    }).join('');

    const totalValue = filtered.reduce((s, i) =>
      s + (parseFloat(i.stock_quantity) || 0) * (parseFloat(i.product?.pro_cost_price) || 0), 0);

    const html = `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8"/>
  <title>Stock Report</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:Arial,sans-serif;font-size:11px;color:#111;}
    @page{size:A4 landscape;margin:1cm;}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}
    table{width:100%;border-collapse:collapse;}
    .hdr{text-align:center;margin-bottom:12px;border-bottom:2px solid #111;padding-bottom:10px;}
    .meta{display:flex;justify-content:space-between;margin:8px 0;font-size:10px;}
    .stats{display:flex;gap:12px;margin:10px 0;}
    .stat{border:1px solid #ccc;border-radius:4px;padding:4px 12px;text-align:center;}
    .footer{margin-top:14px;border-top:1px solid #111;padding-top:8px;display:flex;justify-content:space-between;font-size:10px;}
  </style>
</head>
<body>
  <div class="hdr">
    <div style="font-size:18px;font-weight:bold;direction:rtl;">اتفاق آئرن اینڈ سیمنٹ سٹور</div>
    <div style="font-size:11px;margin-top:2px;direction:rtl;">گجرات سرگودھا روڈ، پاہڑیانوالی</div>
    <div style="font-size:11px;">Ph: 0346-7560306, 0300-7560306</div>
    <div style="font-size:15px;font-weight:bold;margin-top:6px;">Stock Report — ${statusLabel}</div>
  </div>
  <div class="meta">
    <span><strong>Store:</strong> ${storeName}${filterCat ? ` &nbsp;|&nbsp; <strong>Category:</strong> ${filterCat}` : ''}${search ? ` &nbsp;|&nbsp; <strong>Search:</strong> "${search}"` : ''}</span>
    <span><strong>Date:</strong> ${dateStr} &nbsp; <strong>Time:</strong> ${timeStr}</span>
  </div>
  <div class="stats">
    <div class="stat"><div style="font-weight:700;font-size:13px;">${stats.total}</div><div>Total</div></div>
    <div class="stat" style="color:#16a34a;"><div style="font-weight:700;font-size:13px;">${stats.inStock}</div><div>In Stock</div></div>
    <div class="stat" style="color:#d97706;"><div style="font-weight:700;font-size:13px;">${stats.lowStock}</div><div>Low Stock</div></div>
    <div class="stat" style="color:#dc2626;"><div style="font-weight:700;font-size:13px;">${stats.outOfStock}</div><div>Out of Stock</div></div>
    <div class="stat"><div style="font-weight:700;font-size:13px;">Rs ${fmt(totalValue)}</div><div>Total Value</div></div>
  </div>
  <table>
    <thead>
      <tr style="background:#1a237e;color:#fff;">
        <th style="padding:6px;text-align:left;font-size:10px;width:3%">#</th>
        <th style="padding:6px;text-align:left;font-size:10px;width:22%">Product</th>
        <th style="padding:6px;text-align:left;font-size:10px;width:13%">Category</th>
        <th style="padding:6px;text-align:left;font-size:10px;width:11%">Store</th>
        <th style="padding:6px;text-align:left;font-size:10px;width:6%">Unit</th>
        <th style="padding:6px;text-align:right;font-size:10px;width:8%">Qty</th>
        <th style="padding:6px;text-align:left;font-size:10px;width:7%">Min Qty</th>
        <th style="padding:6px;text-align:left;font-size:10px;width:10%">Status</th>
        <th style="padding:6px;text-align:right;font-size:10px;width:10%">Cost Price</th>
        <th style="padding:6px;text-align:right;font-size:10px;width:10%">Stock Value</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr style="background:#f3f4f6;font-weight:bold;">
        <td colspan="5" style="padding:6px;font-size:10px;">TOTALS</td>
        <td style="padding:6px;font-size:10px;text-align:right;">
          ${filtered.reduce((s,i)=>s+(parseFloat(i.stock_quantity)||0),0)}
        </td>
        <td colspan="3" style="padding:6px;"></td>
        <td style="padding:6px;font-size:10px;text-align:right;">Rs ${fmt(totalValue)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="footer">
    <span>Total: ${stats.total} products</span>
    <span style="color:#d97706;">Low Stock: ${stats.lowStock}</span>
    <span style="color:#dc2626;">Out of Stock: ${stats.outOfStock}</span>
    <span>Total Stock Value: Rs ${fmt(totalValue)}</span>
    <span>Printed: ${dateStr} ${timeStr}</span>
  </div>
  <script>window.onload=function(){window.print();}<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=1100,height=750');
    if (w) { w.document.write(html); w.document.close(); }
  };

  // ─── render ─────────────────────────────────────────────────────────────

  const statusButtons = [
    { key: '', label: 'All Items', icon: <Package className="w-4 h-4" />, active: 'bg-gray-800 text-white', inactive: 'bg-white text-gray-600 border border-gray-300' },
    { key: 'low_stock',    label: `Low Stock (${allStock.filter(i => { const q=parseFloat(i.stock_quantity)||0,m=parseFloat(i.min_stock)||0; return q>0&&m>0&&q<=m; }).length})`, icon: <AlertTriangle className="w-4 h-4" />, active: 'bg-yellow-500 text-white', inactive: 'bg-white text-yellow-700 border border-yellow-300' },
    { key: 'out_of_stock', label: `Out of Stock (${allStock.filter(i => (parseFloat(i.stock_quantity)||0) <= 0).length})`, icon: <XCircle className="w-4 h-4" />, active: 'bg-red-600 text-white', inactive: 'bg-white text-red-600 border border-red-300' },
    { key: 'in_stock',     label: 'In Stock',    icon: <CheckCircle className="w-4 h-4" />, active: 'bg-green-600 text-white', inactive: 'bg-white text-green-700 border border-green-300' },
  ];

  return (
    <DashboardLayout>
      <div id="stock-report-page" className="h-full flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 mb-4 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/reports')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Stock Report</h2>
                <p className="text-gray-500 text-sm mt-0.5">View and print inventory levels across all stores</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Refresh</span>
              </button>
              <button
                onClick={handlePrint}
                disabled={loading || filtered.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-medium shadow"
              >
                <Printer className="w-4 h-4" />
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4 print:hidden">
          {[
            { label: 'Total Products',  value: stats.total,                     color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
            { label: 'In Stock',        value: stats.inStock,                   color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
            { label: 'Low Stock',       value: stats.lowStock,                  color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
            { label: 'Out of Stock',    value: stats.outOfStock,                color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
            { label: 'Total Value',     value: `Rs ${fmt(stats.totalValue)}`,   color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
          ].map(c => (
            <div key={c.label} className={`rounded-xl border ${c.border} ${c.bg} p-3`}>
              <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Status Filter Buttons */}
        <div className="flex-shrink-0 mb-3 print:hidden">
          <div className="flex flex-wrap gap-2">
            {statusButtons.map(btn => (
              <button
                key={btn.key}
                onClick={() => setFilterStatus(btn.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  filterStatus === btn.key ? btn.active : btn.inactive
                }`}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex-shrink-0 mb-4 print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search product or category..."
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Store */}
              <select
                value={filterStore}
                onChange={e => setFilterStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="">All Stores</option>
                {stores.map(s => (
                  <option key={s.storeid} value={s.storeid?.toString()}>{s.store_name}</option>
                ))}
              </select>

              {/* Category */}
              <div className="flex gap-2">
                <select
                  value={filterCat}
                  onChange={e => setFilterCat(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {(search || filterStore || filterCat || filterStatus) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Showing <strong className="text-gray-600">{filtered.length}</strong> of <strong className="text-gray-600">{allStock.length}</strong> stock entries
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading stock data...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">No items match your filters</p>
                  <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">Clear filters</button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      {['#', 'Product', 'Category', 'Store', 'Unit', 'Stock Qty', 'Min Qty', 'Status', 'Cost Price', 'Stock Value'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item, idx) => {
                      const qty    = parseFloat(item.stock_quantity) || 0;
                      const min    = parseFloat(item.min_stock) || 0;
                      const cost   = parseFloat(item.product?.pro_cost_price) || 0;
                      const status = getStatus(qty, min);
                      const rowBg  = qty <= 0 ? 'bg-red-50/50' : (min > 0 && qty <= min) ? 'bg-yellow-50/50' : '';

                      return (
                        <tr key={`${item.store_stock_id}-${item.store?.storeid}`}
                          className={`hover:bg-gray-50 transition-colors ${rowBg}`}>
                          <td className="px-4 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-sm font-semibold text-gray-900">{item.product?.pro_title || 'N/A'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500">{item.product?.cat_name || '—'}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-600">{item.store?.store_name || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-500">{item.product?.pro_unit || '—'}</td>
                          <td className="px-4 py-2.5 text-sm font-bold text-right">
                            <span className={qty <= 0 ? 'text-red-600' : min > 0 && qty <= min ? 'text-yellow-600' : 'text-green-700'}>
                              {qty}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500 text-right">{min > 0 ? min : '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${status.cls}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500 text-right">
                            {cost > 0 ? `Rs ${fmt(cost)}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-semibold text-blue-700 text-right">
                            {cost > 0 ? `Rs ${fmt(qty * cost)}` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals row */}
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300 sticky bottom-0">
                    <tr>
                      <td colSpan={5} className="px-4 py-2.5 text-sm font-bold text-gray-700">TOTALS</td>
                      <td className="px-4 py-2.5 text-sm font-bold text-right text-gray-900">
                        {filtered.reduce((s, i) => s + (parseFloat(i.stock_quantity) || 0), 0)}
                      </td>
                      <td colSpan={3} />
                      <td className="px-4 py-2.5 text-sm font-bold text-right text-blue-700">
                        Rs {fmt(stats.totalValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
