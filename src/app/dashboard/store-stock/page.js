'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/dashboard-layout';

import {
  Box, Typography, Button, Card, CardContent, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  CircularProgress, Alert, Snackbar, FormControl, InputLabel, Select,
  MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, Stack, Divider, InputAdornment, Checkbox,
  FormControlLabel, FormGroup, ToggleButton, ToggleButtonGroup,
  Collapse, Badge, LinearProgress
} from '@mui/material';

import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Category as CategoryIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

// ─── helpers ────────────────────────────────────────────────────────────────

function getStockStatus(current, min) {
  const qty = parseFloat(current) || 0;
  const threshold = parseFloat(min) || 0;
  if (qty <= 0) return { label: 'Out of Stock', color: 'error' };
  if (threshold > 0 && qty <= threshold) return { label: 'Low Stock', color: 'warning' };
  return { label: 'In Stock', color: 'success' };
}

function fmt(num, decimals = 2) {
  return parseFloat(num || 0).toLocaleString('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ─── component ──────────────────────────────────────────────────────────────

export default function StoreStockPage() {
  // data
  const [stores, setStores] = useState([]);
  const [storeStock, setStoreStock] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  // low stock panel
  const [showLowStockPanel, setShowLowStockPanel] = useState(false);

  // print dialog
  const [printOpen, setPrintOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    title: 'Stock Report',
    showCategory: true,
    showUnit: true,
    showCostPrice: true,
    showSalePrice: false,
    showStockValue: true,
    showZeroStock: true,
    orientation: 'portrait'
  });

  // ── load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadStores();
    loadAllStock();
    loadCategories();
  }, []);

  const loadStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) setStores((await res.json()).data || await res.json());
    } catch {}
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const d = await res.json();
        setCategories(Array.isArray(d) ? d : d.data || []);
      }
    } catch {}
  };

  const loadAllStock = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/store-stock');
      if (!res.ok) { showSnackbar('Error loading stock', 'error'); return; }
      const data = await res.json();
      const flat = [];
      if (Array.isArray(data)) {
        data.forEach(store => {
          (store.store_stocks || []).forEach(s => {
            flat.push({
              ...s,
              store: { storeid: store.storeid, store_name: store.store_name }
            });
          });
        });
      }
      setStoreStock(flat);
    } catch {
      showSnackbar('Error loading stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  // ── filtered + sorted stock ───────────────────────────────────────────────

  const filteredStock = useMemo(() => {
    let list = storeStock.filter(item => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        item.product?.pro_title?.toLowerCase().includes(q) ||
        item.product?.cat_name?.toLowerCase().includes(q);

      const matchStore = !filterStore ||
        item.store?.storeid?.toString() === filterStore;

      const matchCat = !filterCategory ||
        item.product?.cat_name === filterCategory;

      const qty = parseFloat(item.stock_quantity) || 0;
      const min = parseFloat(item.min_stock) || 0;
      let matchStatus = true;
      if (filterStatus === 'out_of_stock') matchStatus = qty <= 0;
      else if (filterStatus === 'low_stock') matchStatus = qty > 0 && min > 0 && qty <= min;
      else if (filterStatus === 'in_stock') matchStatus = min > 0 ? qty > min : qty > 0;

      return matchSearch && matchStore && matchCat && matchStatus;
    });

    // sort
    list = [...list].sort((a, b) => {
      const nameA = a.product?.pro_title || '';
      const nameB = b.product?.pro_title || '';
      const qtyA = parseFloat(a.stock_quantity) || 0;
      const qtyB = parseFloat(b.stock_quantity) || 0;
      const valA = qtyA * (parseFloat(a.product?.pro_cost_price) || 0);
      const valB = qtyB * (parseFloat(b.product?.pro_cost_price) || 0);

      switch (sortBy) {
        case 'name_asc': return nameA.localeCompare(nameB);
        case 'name_desc': return nameB.localeCompare(nameA);
        case 'qty_asc': return qtyA - qtyB;
        case 'qty_desc': return qtyB - qtyA;
        case 'value_desc': return valB - valA;
        case 'value_asc': return valA - valB;
        default: return nameA.localeCompare(nameB);
      }
    });

    return list;
  }, [storeStock, searchTerm, filterStore, filterCategory, filterStatus, sortBy]);

  // ── summary stats ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = filteredStock.length;
    let inStock = 0, lowStock = 0, outOfStock = 0, totalValue = 0;
    filteredStock.forEach(item => {
      const qty = parseFloat(item.stock_quantity) || 0;
      const min = parseFloat(item.min_stock) || 0;
      const cost = parseFloat(item.product?.pro_cost_price) || 0;
      totalValue += qty * cost;
      const s = getStockStatus(qty, min);
      if (s.color === 'success') inStock++;
      else if (s.color === 'warning') lowStock++;
      else outOfStock++;
    });
    return { total, inStock, lowStock, outOfStock, totalValue };
  }, [filteredStock]);

  // ── unique categories from loaded stock ───────────────────────────────────

  const stockCategories = useMemo(() => {
    const set = new Set(storeStock.map(i => i.product?.cat_name).filter(Boolean));
    return [...set].sort();
  }, [storeStock]);

  // ── low stock grouped by category (all stores, unfiltered) ───────────────

  const lowStockByCategory = useMemo(() => {
    const map = {};
    storeStock.forEach(item => {
      const qty = parseFloat(item.stock_quantity) || 0;
      const min = parseFloat(item.min_stock) || 0;
      const status = getStockStatus(qty, min);
      if (status.color === 'success') return; // skip healthy stock
      const cat = item.product?.cat_name || 'Uncategorized';
      if (!map[cat]) map[cat] = { cat_name: cat, lowStock: 0, outOfStock: 0, items: [] };
      if (status.color === 'warning') map[cat].lowStock++;
      else map[cat].outOfStock++;
      map[cat].items.push(item);
    });
    // sort by total alerts descending
    return Object.values(map).sort(
      (a, b) => (b.lowStock + b.outOfStock) - (a.lowStock + a.outOfStock)
    );
  }, [storeStock]);

  // ── print in new window ───────────────────────────────────────────────────

  const handlePrint = () => {
    const rows = filteredStock.filter(item =>
      printOptions.showZeroStock || (parseFloat(item.stock_quantity) || 0) > 0
    );

    const storeName = filterStore
      ? stores.find(s => s.storeid?.toString() === filterStore)?.store_name || 'All Stores'
      : 'All Stores';

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB');
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // build column headers
    const cols = [
      { key: '#', label: '#', width: '4%' },
      { key: 'product', label: 'Product', width: printOptions.showCategory ? '22%' : '30%' },
      printOptions.showCategory && { key: 'category', label: 'Category', width: '14%' },
      { key: 'store', label: 'Store', width: '12%' },
      printOptions.showUnit && { key: 'unit', label: 'Unit', width: '6%' },
      { key: 'qty', label: 'Stock Qty', width: '8%' },
      { key: 'status', label: 'Status', width: '9%' },
      printOptions.showCostPrice && { key: 'cost', label: 'Cost Price', width: '10%' },
      printOptions.showSalePrice && { key: 'sale', label: 'Sale Price', width: '10%' },
      printOptions.showStockValue && { key: 'value', label: 'Stock Value', width: '11%' },
    ].filter(Boolean);

    const headerHtml = cols.map(c =>
      `<th style="width:${c.width};padding:6px 4px;background:#374151;color:#fff;text-align:left;font-size:11px;">${c.label}</th>`
    ).join('');

    const rowsHtml = rows.map((item, i) => {
      const qty = parseFloat(item.stock_quantity) || 0;
      const min = parseFloat(item.min_stock) || 0;
      const cost = parseFloat(item.product?.pro_cost_price) || 0;
      const sale = parseFloat(item.product?.pro_sale_price) || 0;
      const value = qty * cost;
      const status = getStockStatus(qty, min);
      const statusColor = status.color === 'error' ? '#dc2626' : status.color === 'warning' ? '#d97706' : '#16a34a';
      const bg = i % 2 === 0 ? '#fff' : '#f9fafb';

      return `<tr style="background:${bg};">
        <td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;font-weight:600;">${item.product?.pro_title || 'N/A'}</td>
        ${printOptions.showCategory ? `<td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;">${item.product?.cat_name || '—'}</td>` : ''}
        <td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;">${item.store?.store_name || 'N/A'}</td>
        ${printOptions.showUnit ? `<td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;">${item.product?.pro_unit || '—'}</td>` : ''}
        <td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;font-weight:700;">${qty}</td>
        <td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;color:${statusColor};font-weight:600;">${status.label}</td>
        ${printOptions.showCostPrice ? `<td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;">Rs ${fmt(cost)}</td>` : ''}
        ${printOptions.showSalePrice ? `<td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;">Rs ${fmt(sale)}</td>` : ''}
        ${printOptions.showStockValue ? `<td style="padding:5px 4px;font-size:10px;border-bottom:1px solid #e5e7eb;">Rs ${fmt(value)}</td>` : ''}
      </tr>`;
    }).join('');

    const totalValue = rows.reduce((s, item) => {
      return s + (parseFloat(item.stock_quantity) || 0) * (parseFloat(item.product?.pro_cost_price) || 0);
    }, 0);

    const html = `<!DOCTYPE html><html>
<head>
  <meta charset="utf-8"/>
  <title>${printOptions.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; }
    @page { size: A4 ${printOptions.orientation}; margin: 1cm; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    table { width: 100%; border-collapse: collapse; }
    .header { text-align: center; margin-bottom: 12px; border-bottom: 2px solid #111; padding-bottom: 10px; }
    .meta { display: flex; justify-content: space-between; margin: 8px 0; font-size: 10px; }
    .summary { display: flex; gap: 16px; margin: 10px 0; font-size: 10px; }
    .summary-item { border: 1px solid #ccc; border-radius: 4px; padding: 4px 10px; text-align: center; }
    .footer { margin-top: 16px; border-top: 1px solid #111; padding-top: 8px; display: flex; justify-content: space-between; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size:18px;font-weight:bold;font-family:'Arial';direction:rtl;">اتفاق آئرن اینڈ سیمنٹ سٹور</div>
    <div style="font-size:11px;margin-top:2px;direction:rtl;">گجرات سرگودھا روڈ، پاہڑیانوالی</div>
    <div style="font-size:11px;">Ph: 0346-7560306, 0300-7560306</div>
    <div style="font-size:15px;font-weight:bold;margin-top:6px;">${printOptions.title}</div>
  </div>
  <div class="meta">
    <span><strong>Store:</strong> ${storeName}</span>
    <span><strong>Date:</strong> ${dateStr} &nbsp; <strong>Time:</strong> ${timeStr}</span>
  </div>
  ${filterStatus || filterCategory || searchTerm ? `
  <div style="font-size:10px;margin-bottom:6px;color:#555;">
    <strong>Filters:</strong>
    ${filterStatus ? `Status: ${filterStatus.replace('_', ' ')}` : ''}
    ${filterCategory ? ` | Category: ${filterCategory}` : ''}
    ${searchTerm ? ` | Search: "${searchTerm}"` : ''}
  </div>` : ''}
  <div class="summary">
    <div class="summary-item"><div style="font-weight:700;">${rows.length}</div><div>Total</div></div>
    <div class="summary-item" style="color:#16a34a;"><div style="font-weight:700;">${rows.filter(i => getStockStatus(i.stock_quantity, i.min_stock).color === 'success').length}</div><div>In Stock</div></div>
    <div class="summary-item" style="color:#d97706;"><div style="font-weight:700;">${rows.filter(i => getStockStatus(i.stock_quantity, i.min_stock).color === 'warning').length}</div><div>Low Stock</div></div>
    <div class="summary-item" style="color:#dc2626;"><div style="font-weight:700;">${rows.filter(i => getStockStatus(i.stock_quantity, i.min_stock).color === 'error').length}</div><div>Out of Stock</div></div>
    ${printOptions.showStockValue ? `<div class="summary-item"><div style="font-weight:700;">Rs ${fmt(totalValue)}</div><div>Total Value</div></div>` : ''}
  </div>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="footer">
    <span><strong>Total Products:</strong> ${rows.length}</span>
    ${printOptions.showStockValue ? `<span><strong>Total Stock Value:</strong> Rs ${fmt(totalValue)}</span>` : ''}
    <span>Generated: ${dateStr} ${timeStr}</span>
  </div>
  <script>window.onload = function() { window.print(); }<\/script>
</body></html>`;

    const w = window.open('', '_blank', 'width=960,height=700');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    setPrintOpen(false);
  };

  // ─── render ─────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <Box sx={{ p: 2 }}>

        {/* Page Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InventoryIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">Store Stock Report</Typography>
              <Typography variant="body2" color="text.secondary">Live inventory across all stores</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadAllStock} disabled={loading} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Badge badgeContent={lowStockByCategory.length} color="error" invisible={lowStockByCategory.length === 0}>
              <Button
                variant={showLowStockPanel ? 'contained' : 'outlined'}
                color="warning"
                startIcon={<WarningIcon />}
                endIcon={showLowStockPanel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowLowStockPanel(v => !v)}
              >
                Low Stock by Category
              </Button>
            </Badge>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => setPrintOpen(true)}
              sx={{ background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)' }}
            >
              Print Report
            </Button>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label: 'Total Products', value: stats.total, color: '#1976d2', icon: <InventoryIcon />, clickable: false },
            { label: 'In Stock', value: stats.inStock, color: '#2e7d32', icon: <CheckCircleIcon />, clickable: false },
            { label: 'Low Stock', value: stats.lowStock, color: '#ed6c02', icon: <WarningIcon />, clickable: true, onClick: () => { setShowLowStockPanel(true); setFilterStatus('low_stock'); } },
            { label: 'Out of Stock', value: stats.outOfStock, color: '#d32f2f', icon: <CancelIcon />, clickable: true, onClick: () => { setShowLowStockPanel(true); setFilterStatus('out_of_stock'); } },
            { label: 'Total Stock Value', value: `Rs ${fmt(stats.totalValue, 0)}`, color: '#7b1fa2', icon: <TrendingUpIcon />, clickable: false },
          ].map((card) => (
            <Grid item xs={6} sm={4} md={2.4} key={card.label}>
              <Card
                onClick={card.clickable ? card.onClick : undefined}
                sx={{
                  borderLeft: `4px solid ${card.color}`,
                  height: '100%',
                  cursor: card.clickable ? 'pointer' : 'default',
                  transition: 'box-shadow 0.2s',
                  '&:hover': card.clickable ? { boxShadow: 4 } : {}
                }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: card.color, display: 'flex' }}>{card.icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: card.color, lineHeight: 1.2 }}>
                        {card.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {card.label}
                        {card.clickable && <span style={{ fontSize: '9px', marginLeft: 4, opacity: 0.7 }}>▶ click to view</span>}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Low Stock by Category Panel */}
        <Collapse in={showLowStockPanel}>
          <Card sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              {/* Panel Header */}
              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1.5,
                background: 'linear-gradient(90deg, #fff3e0 0%, #fff8f0 100%)',
                borderBottom: '1px solid', borderColor: 'warning.light'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CategoryIcon color="warning" />
                  <Typography variant="subtitle1" fontWeight="bold" color="warning.dark">
                    Low Stock Alert — by Category
                  </Typography>
                  <Chip
                    label={`${lowStockByCategory.length} categor${lowStockByCategory.length === 1 ? 'y' : 'ies'} affected`}
                    size="small" color="warning" variant="outlined"
                  />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button size="small" variant="text" color="warning"
                    onClick={() => { setFilterStatus(''); setFilterCategory(''); }}>
                    Show All
                  </Button>
                  <IconButton size="small" onClick={() => setShowLowStockPanel(false)}>
                    <ExpandLessIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {lowStockByCategory.length === 0 ? (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ color: 'success.main', fontSize: 36, mb: 1 }} />
                  <Typography color="success.main" fontWeight="bold">All categories are well stocked!</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#fff8f0' }}>
                        <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Low Stock</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Out of Stock</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Total Affected</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Severity</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockByCategory.map((cat, idx) => {
                        const total = cat.lowStock + cat.outOfStock;
                        const severity = cat.outOfStock > 0 ? 'error' : 'warning';
                        const pctOut = Math.round((cat.outOfStock / total) * 100);
                        return (
                          <TableRow key={cat.cat_name} hover
                            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#fff3e0' } }}
                            onClick={() => {
                              setFilterCategory(cat.cat_name);
                              setFilterStatus(cat.outOfStock > 0 ? 'out_of_stock' : 'low_stock');
                            }}
                          >
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CategoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" fontWeight="600">{cat.cat_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {cat.lowStock > 0 ? (
                                <Chip label={cat.lowStock} size="small" color="warning" />
                              ) : (
                                <Typography variant="body2" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              {cat.outOfStock > 0 ? (
                                <Chip label={cat.outOfStock} size="small" color="error" />
                              ) : (
                                <Typography variant="body2" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="bold">{total}</Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ width: 120 }}>
                              <Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={pctOut}
                                  color={severity}
                                  sx={{ height: 6, borderRadius: 3, mb: 0.5 }}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {pctOut}% out of stock
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title="Show low stock for this category">
                                  <Button size="small" variant="outlined" color="warning" sx={{ minWidth: 0, px: 1, fontSize: '0.7rem' }}
                                    onClick={e => { e.stopPropagation(); setFilterCategory(cat.cat_name); setFilterStatus('low_stock'); }}>
                                    Low
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Show out of stock for this category">
                                  <Button size="small" variant="outlined" color="error" sx={{ minWidth: 0, px: 1, fontSize: '0.7rem' }}
                                    onClick={e => { e.stopPropagation(); setFilterCategory(cat.cat_name); setFilterStatus('out_of_stock'); }}>
                                    Out
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Show all items for this category">
                                  <Button size="small" variant="outlined" color="primary" sx={{ minWidth: 0, px: 1, fontSize: '0.7rem' }}
                                    onClick={e => { e.stopPropagation(); setFilterCategory(cat.cat_name); setFilterStatus(''); }}>
                                    All
                                  </Button>
                                </Tooltip>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Collapse>

        {/* Filters */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth size="small"
                  label="Search product or category"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small" /></IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Store</InputLabel>
                  <Select value={filterStore} onChange={e => setFilterStore(e.target.value)} label="Store">
                    <MenuItem value="">All Stores</MenuItem>
                    {stores.map(s => (
                      <MenuItem key={s.storeid} value={s.storeid?.toString()}>{s.store_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} label="Category">
                    <MenuItem value="">All Categories</MenuItem>
                    {stockCategories.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Status</InputLabel>
                  <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} label="Status">
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="in_stock">In Stock</MenuItem>
                    <MenuItem value="low_stock">Low Stock</MenuItem>
                    <MenuItem value="out_of_stock">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <FormControl fullWidth size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Sort By</InputLabel>
                  <Select value={sortBy} onChange={e => setSortBy(e.target.value)} label="Sort By">
                    <MenuItem value="name_asc">Name A→Z</MenuItem>
                    <MenuItem value="name_desc">Name Z→A</MenuItem>
                    <MenuItem value="qty_desc">Stock ↓ High</MenuItem>
                    <MenuItem value="qty_asc">Stock ↑ Low</MenuItem>
                    <MenuItem value="value_desc">Value ↓ High</MenuItem>
                    <MenuItem value="value_asc">Value ↑ Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={3} md={1}>
                <Button fullWidth size="small" variant="outlined" startIcon={<ClearIcon />}
                  onClick={() => {
                    setSearchTerm(''); setFilterStore(''); setFilterCategory('');
                    setFilterStatus(''); setSortBy('name_asc');
                  }}>
                  Clear
                </Button>
              </Grid>
            </Grid>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing <strong>{filteredStock.length}</strong> of <strong>{storeStock.length}</strong> stock entries
            </Typography>
          </CardContent>
        </Card>

        {/* Stock Table */}
        <Card>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 'bold', bgcolor: '#1a237e', color: '#fff', py: 1.2 } }}>
                      <TableCell sx={{ color: '#fff !important', width: 40 }}>#</TableCell>
                      <TableCell sx={{ color: '#fff !important' }}>Product</TableCell>
                      <TableCell sx={{ color: '#fff !important' }}>Category</TableCell>
                      <TableCell sx={{ color: '#fff !important' }}>Store</TableCell>
                      <TableCell sx={{ color: '#fff !important', width: 60 }}>Unit</TableCell>
                      <TableCell sx={{ color: '#fff !important', width: 90 }} align="right">Stock Qty</TableCell>
                      <TableCell sx={{ color: '#fff !important', width: 110 }}>Status</TableCell>
                      <TableCell sx={{ color: '#fff !important', width: 100 }} align="right">Cost Price</TableCell>
                      <TableCell sx={{ color: '#fff !important', width: 100 }} align="right">Sale Price</TableCell>
                      <TableCell sx={{ color: '#fff !important', width: 110 }} align="right">Stock Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStock.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          {storeStock.length === 0 ? 'No stock data found' : 'No items match your filters'}
                        </TableCell>
                      </TableRow>
                    ) : filteredStock.map((item, idx) => {
                      const qty = parseFloat(item.stock_quantity) || 0;
                      const min = parseFloat(item.min_stock) || 0;
                      const cost = parseFloat(item.product?.pro_cost_price) || 0;
                      const sale = parseFloat(item.product?.pro_sale_price) || 0;
                      const status = getStockStatus(qty, min);
                      const rowBg = qty <= 0 ? '#fff5f5' : (min > 0 && qty <= min) ? '#fffbeb' : 'inherit';

                      return (
                        <TableRow key={`${item.store_stock_id}-${item.store?.storeid}`}
                          hover sx={{ bgcolor: rowBg }}>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{idx + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">{item.product?.pro_title || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{item.product?.cat_name || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{item.store?.store_name || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{item.product?.pro_unit || '—'}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold"
                              sx={{ color: qty <= 0 ? 'error.main' : qty <= min && min > 0 ? 'warning.main' : 'success.main' }}>
                              {qty}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={status.label} color={status.color} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {cost > 0 ? `Rs ${fmt(cost)}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {sale > 0 ? `Rs ${fmt(sale)}` : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="600" color="primary">
                              {cost > 0 ? `Rs ${fmt(qty * cost, 0)}` : '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredStock.length > 0 && (
                      <TableRow sx={{ bgcolor: '#f3f4f6', '& td': { fontWeight: 'bold', py: 1 } }}>
                        <TableCell colSpan={5}><Typography variant="body2" fontWeight="bold">TOTALS</Typography></TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {filteredStock.reduce((s, i) => s + (parseFloat(i.stock_quantity) || 0), 0)}
                          </Typography>
                        </TableCell>
                        <TableCell colSpan={3} />
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            Rs {fmt(stats.totalValue, 0)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Print Settings Dialog */}
        <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SettingsIcon color="primary" />
            Print Settings
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2.5}>
              <TextField
                fullWidth size="small"
                label="Report Title"
                value={printOptions.title}
                onChange={e => setPrintOptions(p => ({ ...p, title: e.target.value }))}
              />

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Columns to Include</Typography>
                <FormGroup row>
                  {[
                    { key: 'showCategory', label: 'Category' },
                    { key: 'showUnit', label: 'Unit' },
                    { key: 'showCostPrice', label: 'Cost Price' },
                    { key: 'showSalePrice', label: 'Sale Price' },
                    { key: 'showStockValue', label: 'Stock Value' },
                  ].map(opt => (
                    <FormControlLabel key={opt.key}
                      control={
                        <Checkbox size="small"
                          checked={printOptions[opt.key]}
                          onChange={e => setPrintOptions(p => ({ ...p, [opt.key]: e.target.checked }))}
                        />
                      }
                      label={opt.label}
                      sx={{ width: '48%' }}
                    />
                  ))}
                </FormGroup>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Stock Filter for Print</Typography>
                <FormControlLabel
                  control={
                    <Checkbox size="small"
                      checked={printOptions.showZeroStock}
                      onChange={e => setPrintOptions(p => ({ ...p, showZeroStock: e.target.checked }))}
                    />
                  }
                  label="Include zero / out-of-stock items"
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Paper Orientation</Typography>
                <ToggleButtonGroup
                  exclusive size="small"
                  value={printOptions.orientation}
                  onChange={(_, v) => v && setPrintOptions(p => ({ ...p, orientation: v }))}
                >
                  <ToggleButton value="portrait">Portrait (A4)</ToggleButton>
                  <ToggleButton value="landscape">Landscape (A4)</ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Alert severity="info" sx={{ py: 0.5 }}>
                The report will open in a new tab and print automatically.
                Currently showing <strong>{filteredStock.length}</strong> item(s) based on your active filters.
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPrintOpen(false)}>Cancel</Button>
            <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
              Open & Print
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar open={snackbar.open} autoHideDuration={5000}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Box>
    </DashboardLayout>
  );
}
