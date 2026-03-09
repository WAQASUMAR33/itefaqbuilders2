'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '../components/dashboard-layout';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  Chip,
  Divider,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Print as PrintIcon,
  Save as SaveIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  SwapHoriz as SwapIcon,
  Inventory as InventoryIcon,
  Store as StoreIcon,
  ListAlt as ListIcon,
} from '@mui/icons-material';

export default function StockTransferPage() {
  const [transfers, setTransfers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTransferIndex, setCurrentTransferIndex] = useState(-1);
  const [currentView, setCurrentView] = useState('list');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFromStore, setFilterFromStore] = useState('');
  const [filterToStore, setFilterToStore] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Form state
  const [transferNo, setTransferNo] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [fromStore, setFromStore] = useState(null);
  const [toStore, setToStore] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [packing, setPacking] = useState('0');
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });
  const handleCloseSnackbar = () => setSnackbar(s => ({ ...s, open: false }));

  useEffect(() => {
    fetchStores();
    fetchProducts();
    fetchTransfers();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/stores');
      if (res.ok) {
        const result = await res.json();
        const data = result.success ? result.data : (result.data || result);
        setStores(Array.isArray(data) ? data : []);
      } else { setStores([]); }
    } catch { setStores([]); }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const result = await res.json();
        const data = result.data || result;
        setProducts(Array.isArray(data) ? data : []);
      } else { setProducts([]); }
    } catch { setProducts([]); }
  };

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stock-transfers');
      if (res.ok) {
        const data = await res.json();
        setTransfers(data);
        if (data.length > 0 && currentTransferIndex === -1) {
          setCurrentTransferIndex(0);
          loadTransfer(data[0]);
        }
      }
    } catch { showSnackbar('Error fetching transfers', 'error'); }
    finally { setLoading(false); }
  };

  const loadTransfer = (transfer) => {
    if (!transfer) return;
    setTransferNo(transfer.transfer_no || '');
    setTransferDate(
      transfer.transfer_date
        ? new Date(transfer.transfer_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
    );
    const arr = Array.isArray(stores) ? stores : [];
    setFromStore(arr.find(s => s?.storeid === transfer.from_store_id) || null);
    setToStore(arr.find(s => s?.storeid === transfer.to_store_id) || null);
    setNotes(transfer.notes || '');
    setTransferItems(transfer.transfer_details || []);
  };

  const handleSearchTransfer = async () => {
    if (!transferNo.trim()) { showSnackbar('Please enter a transfer number', 'warning'); return; }
    try {
      setLoading(true);
      const res = await fetch(`/api/stock-transfers?transfer_no=${transferNo}`);
      if (res.ok) {
        const transfer = await res.json();
        const idx = transfers.findIndex(t => t.transfer_id === transfer.transfer_id);
        if (idx !== -1) setCurrentTransferIndex(idx);
        loadTransfer(transfer);
        showSnackbar('Transfer found', 'success');
      } else { showSnackbar('Transfer not found', 'error'); }
    } catch { showSnackbar('Error searching transfer', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const fetchStock = async () => {
      if (!selectedProduct || !fromStore) { setCurrentStock(null); return; }
      try {
        const res = await fetch(`/api/store-stock?store_id=${fromStore.storeid}&pro_id=${selectedProduct.pro_id}`);
        if (res.ok) {
          const result = await res.json();
          const data = result.data || result;
          if (Array.isArray(data) && data.length > 0) {
            setCurrentStock(data[0].stock_quantity || 0);
          } else if (data?.stock_quantity !== undefined) {
            setCurrentStock(data.stock_quantity || 0);
          } else { setCurrentStock(0); }
        } else { setCurrentStock(0); }
      } catch { setCurrentStock(0); }
    };
    fetchStock();
  }, [selectedProduct, fromStore]);

  const handleAddProduct = () => {
    if (!selectedProduct) { showSnackbar('Please select a product', 'warning'); return; }
    if (!quantity || parseFloat(quantity) <= 0) { showSnackbar('Please enter a valid quantity', 'warning'); return; }
    const existingIdx = transferItems.findIndex(item => item.pro_id === selectedProduct.pro_id);
    if (existingIdx !== -1) {
      const updated = [...transferItems];
      updated[existingIdx] = { ...updated[existingIdx], quantity: parseFloat(quantity), packing: parseFloat(packing || 0) };
      setTransferItems(updated);
    } else {
      setTransferItems([...transferItems, {
        transfer_detail_id: Date.now(),
        pro_id: selectedProduct.pro_id,
        product: selectedProduct,
        quantity: parseFloat(quantity),
        packing: parseFloat(packing || 0),
      }]);
    }
    setSelectedProduct(null);
    setQuantity('');
    setPacking('0');
    setCurrentStock(null);
  };

  const handleRemoveProduct = (index) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!transferDate) { showSnackbar('Please select a date', 'warning'); return; }
    if (!fromStore) { showSnackbar('Please select from store', 'warning'); return; }
    if (!toStore) { showSnackbar('Please select to store', 'warning'); return; }
    if (fromStore.storeid === toStore.storeid) { showSnackbar('From and To store cannot be the same', 'error'); return; }
    if (transferItems.length === 0) { showSnackbar('Please add at least one product', 'warning'); return; }

    try {
      setLoading(true);
      const currentTransfer = transfers[currentTransferIndex];
      const method = currentTransfer?.transfer_id ? 'PUT' : 'POST';
      const body = {
        transfer_date: transferDate,
        from_store_id: fromStore.storeid,
        to_store_id: toStore.storeid,
        notes,
        transfer_details: transferItems.map(item => ({
          pro_id: item.pro_id,
          quantity: item.quantity,
          packing: item.packing || 0,
        })),
        updated_by: 1,
        ...(currentTransfer?.transfer_id && { transfer_id: currentTransfer.transfer_id }),
      };
      const res = await fetch('/api/stock-transfers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showSnackbar('Transfer saved successfully', 'success');
        await fetchTransfers();
        setCurrentView('list');
        handleNew();
      } else {
        const err = await res.json();
        showSnackbar(err.error || 'Failed to save transfer', 'error');
      }
    } catch { showSnackbar('Error saving transfer', 'error'); }
    finally { setLoading(false); }
  };

  const handleNew = () => {
    setTransferNo('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setFromStore(null);
    setToStore(null);
    setSelectedProduct(null);
    setQuantity('');
    setPacking('0');
    setNotes('');
    setTransferItems([]);
    setCurrentTransferIndex(-1);
    setCurrentView('form');
  };

  const handleEditTransfer = (transfer) => {
    const idx = transfers.findIndex(t => t.transfer_id === transfer.transfer_id);
    if (idx !== -1) { setCurrentTransferIndex(idx); loadTransfer(transfer); setCurrentView('form'); }
  };

  const handleViewList = () => { setCurrentView('list'); fetchTransfers(); };

  const handleCancel = () => {
    if (currentTransferIndex !== -1 && transfers[currentTransferIndex]) {
      loadTransfer(transfers[currentTransferIndex]);
    } else { handleNew(); }
  };

  const handleFirst    = () => { if (transfers.length > 0) { setCurrentTransferIndex(0); loadTransfer(transfers[0]); } };
  const handlePrevious = () => { if (currentTransferIndex > 0) { const i = currentTransferIndex - 1; setCurrentTransferIndex(i); loadTransfer(transfers[i]); } };
  const handleNext     = () => { if (currentTransferIndex < transfers.length - 1) { const i = currentTransferIndex + 1; setCurrentTransferIndex(i); loadTransfer(transfers[i]); } };
  const handleLast     = () => { if (transfers.length > 0) { const i = transfers.length - 1; setCurrentTransferIndex(i); loadTransfer(transfers[i]); } };

  const filteredTransfers = useMemo(() => {
    if (!Array.isArray(transfers)) return [];
    return transfers.filter(t => {
      const matchesSearch = searchTerm === '' ||
        (t.transfer_no && t.transfer_no.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.transfer_id && t.transfer_id.toString().includes(searchTerm));
      const matchesFrom = filterFromStore === '' ||
        t.from_store?.storeid?.toString() === filterFromStore ||
        t.from_store_id?.toString() === filterFromStore;
      const matchesTo = filterToStore === '' ||
        t.to_store?.storeid?.toString() === filterToStore ||
        t.to_store_id?.toString() === filterToStore;
      const matchesFrom_d = dateFrom === '' || (t.transfer_date && new Date(t.transfer_date) >= new Date(dateFrom));
      const matchesTo_d   = dateTo   === '' || (t.transfer_date && new Date(t.transfer_date) <= new Date(dateTo));
      return matchesSearch && matchesFrom && matchesTo && matchesFrom_d && matchesTo_d;
    });
  }, [transfers, searchTerm, filterFromStore, filterToStore, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm(''); setFilterFromStore(''); setFilterToStore(''); setDateFrom(''); setDateTo('');
  };

  // ─── Snackbar (shared) ────────────────────────────────────────────────────
  const SnackbarEl = (
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
  );

  // ─── UNIQUE STORES ────────────────────────────────────────────────────────
  const fromStoreCount = new Set(transfers.map(t => t.from_store_id).filter(Boolean)).size;

  // ═════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ═════════════════════════════════════════════════════════════════════════
  if (currentView === 'list') {
    return (
      <DashboardLayout>
        <Container maxWidth={false} sx={{ py: 4 }}>
          <Stack spacing={4}>

            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Stock Transfers
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  Manage inventory transfers between stores
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleNew}
                sx={{
                  background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
                  boxShadow: '0 3px 5px 2px rgba(156,39,176,.3)',
                  '&:hover': { background: 'linear-gradient(45deg, #7B1FA2 30%, #C2185B 90%)', transform: 'scale(1.03)' },
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                New Transfer
              </Button>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={3}>
              {[
                { label: 'Total Transfers', value: transfers.length, icon: <SwapIcon />, gradient: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)' },
                { label: 'Filtered Results', value: filteredTransfers.length, icon: <ListIcon />, gradient: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' },
                { label: 'Source Stores', value: fromStoreCount, icon: <StoreIcon />, gradient: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)' },
                { label: 'Total Products', value: transfers.reduce((s, t) => s + (t.transfer_details?.length || 0), 0), icon: <InventoryIcon />, gradient: 'linear-gradient(45deg, #FF9800 30%, #F44336 90%)' },
              ].map((stat) => (
                <Grid item xs={12} sm={6} md={3} key={stat.label}>
                  <Card sx={{ background: stat.gradient, color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>{stat.icon}</Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ opacity: 0.85 }}>{stat.label}</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Filters */}
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterIcon color="action" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Filter Transfers</Typography>
                  </Box>
                  <Button size="small" onClick={clearFilters} startIcon={<ClearIcon />}>
                    Clear All
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth size="small" label="Search"
                      placeholder="Transfer No, Notes, or ID…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      sx={{ minWidth: 200 }}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      fullWidth size="small"
                      options={Array.isArray(stores) ? stores : []}
                      getOptionLabel={(o) => o?.store_name || ''}
                      value={stores.find(s => s?.storeid?.toString() === filterFromStore) || null}
                      onChange={(_, v) => setFilterFromStore(v ? v.storeid.toString() : '')}
                      isOptionEqualToValue={(o, v) => o?.storeid === v?.storeid}
                      renderInput={(params) => <TextField {...params} label="From Store" sx={{ minWidth: 200 }} />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                      fullWidth size="small"
                      options={Array.isArray(stores) ? stores : []}
                      getOptionLabel={(o) => o?.store_name || ''}
                      value={stores.find(s => s?.storeid?.toString() === filterToStore) || null}
                      onChange={(_, v) => setFilterToStore(v ? v.storeid.toString() : '')}
                      isOptionEqualToValue={(o, v) => o?.storeid === v?.storeid}
                      renderInput={(params) => <TextField {...params} label="To Store" sx={{ minWidth: 200 }} />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth size="small" type="date" label="From Date"
                      value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 200 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth size="small" type="date" label="To Date"
                      value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 200 }}
                    />
                  </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  Showing {filteredTransfers.length} of {transfers.length} transfers
                </Typography>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Transfer Records</Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredTransfers.length} records
                </Typography>
              </Box>
              <TableContainer>
                <Table sx={{ minWidth: 750 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Transfer No</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>From Store</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>To Store</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Items</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Notes</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : filteredTransfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Box sx={{ py: 8, textAlign: 'center' }}>
                            <SwapIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              {transfers.length === 0 ? 'No stock transfers found' : 'No transfers match your filters'}
                            </Typography>
                            <Typography variant="body2" color="text.disabled">
                              {transfers.length === 0 ? 'Create your first transfer to get started.' : 'Try adjusting your filter criteria.'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransfers.map((transfer) => (
                        <TableRow key={transfer.transfer_id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>
                            <Chip
                              label={transfer.transfer_no || `#${transfer.transfer_id}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {transfer.transfer_date
                                ? new Date(transfer.transfer_date).toLocaleDateString('en-GB')
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StoreIcon fontSize="small" color="action" />
                              <Typography variant="body2">{transfer.from_store?.store_name || '—'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <StoreIcon fontSize="small" color="action" />
                              <Typography variant="body2">{transfer.to_store?.store_name || '—'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={transfer.transfer_details?.length || 0}
                              size="small"
                              color="primary"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {transfer.notes || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit Transfer">
                              <IconButton size="small" color="primary" onClick={() => handleEditTransfer(transfer)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>

          </Stack>
        </Container>
        {SnackbarEl}
      </DashboardLayout>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // FORM VIEW
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Stack spacing={3}>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                {currentTransferIndex === -1 ? 'New Stock Transfer' : `Transfer: ${transferNo || `#${transfers[currentTransferIndex]?.transfer_id || ''}`}`}
              </Typography>
              {transfers.length > 0 && currentTransferIndex !== -1 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Record {currentTransferIndex + 1} of {transfers.length}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<ListIcon />} onClick={handleViewList}>
                View List
              </Button>
              <TextField
                size="small"
                label="Transfer No"
                value={transferNo}
                onChange={(e) => setTransferNo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchTransfer()}
                sx={{ width: 180 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search">
                        <IconButton size="small" onClick={handleSearchTransfer}>
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          {/* Transfer Details Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Transfer Details
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Transfer Date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                  <Autocomplete
                    fullWidth
                    options={Array.isArray(stores) ? stores : []}
                    getOptionLabel={(o) => o?.store_name || ''}
                    value={fromStore}
                    onChange={(_, v) => setFromStore(v)}
                    isOptionEqualToValue={(o, v) => o?.storeid === v?.storeid}
                    renderInput={(params) => (
                      <TextField {...params} label="From Store" placeholder="Select source store" sx={{ minWidth: 200 }} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={4}>
                  <Autocomplete
                    fullWidth
                    options={Array.isArray(stores) ? stores : []}
                    getOptionLabel={(o) => o?.store_name || ''}
                    value={toStore}
                    onChange={(_, v) => setToStore(v)}
                    isOptionEqualToValue={(o, v) => o?.storeid === v?.storeid}
                    renderInput={(params) => (
                      <TextField {...params} label="To Store" placeholder="Select destination store" sx={{ minWidth: 200 }} />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Add Product Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Add Products
              </Typography>

              {/* Stock badge */}
              {selectedProduct && fromStore && currentStock !== null && (
                <Box sx={{ mb: 2 }}>
                  <Chip
                    icon={<InventoryIcon />}
                    label={`Available Stock: ${currentStock}`}
                    color={currentStock > 0 ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Box>
              )}

              <Grid container spacing={2} alignItems="flex-end">
                <Grid item xs={12} md={5}>
                  <Autocomplete
                    fullWidth
                    options={Array.isArray(products) ? products : []}
                    getOptionLabel={(o) => o?.pro_title || ''}
                    value={selectedProduct}
                    onChange={(_, v) => { setSelectedProduct(v); setCurrentStock(null); }}
                    isOptionEqualToValue={(o, v) => o?.pro_id === v?.pro_id}
                    renderInput={(params) => (
                      <TextField {...params} label="Select Product" placeholder="Search product…" sx={{ minWidth: 200 }} />
                    )}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                    placeholder="0"
                    sx={{ minWidth: 120 }}
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    fullWidth
                    label="Packing"
                    type="number"
                    value={packing}
                    onChange={(e) => setPacking(e.target.value)}
                    inputProps={{ min: 0, step: 1 }}
                    placeholder="0"
                    sx={{ minWidth: 120 }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    sx={{
                      height: 56,
                      background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
                      '&:hover': { background: 'linear-gradient(45deg, #7B1FA2 30%, #C2185B 90%)' },
                    }}
                  >
                    Add Product
                  </Button>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Items Table */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Product</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Packing</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Remove</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transferItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Box sx={{ py: 4, textAlign: 'center' }}>
                            <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                            <Typography variant="body2" color="text.disabled">
                              No products added yet. Use the form above to add products.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      transferItems.map((item, idx) => (
                        <TableRow key={item.transfer_detail_id || idx} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{idx + 1}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.product?.pro_title || `Product ${item.pro_id}`}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={item.quantity} size="small" color="primary" />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{item.packing || 0}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Remove">
                              <IconButton size="small" color="error" onClick={() => handleRemoveProduct(idx)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {transferItems.length > 0 && (
                <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip
                    label={`${transferItems.length} product${transferItems.length !== 1 ? 's' : ''} · Total qty: ${transferItems.reduce((s, i) => s + (i.quantity || 0), 0)}`}
                    color="secondary"
                    variant="outlined"
                  />
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Notes */}
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any notes for this transfer…"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>

            {/* Record Navigation */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="First">
                <span>
                  <Button variant="outlined" size="small" startIcon={<FirstPageIcon />} onClick={handleFirst} disabled={currentTransferIndex <= 0}>
                    First
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Previous">
                <span>
                  <Button variant="outlined" size="small" startIcon={<ChevronLeftIcon />} onClick={handlePrevious} disabled={currentTransferIndex <= 0}>
                    Prev
                  </Button>
                </span>
              </Tooltip>
              {transfers.length > 0 && (
                <Chip
                  label={currentTransferIndex === -1 ? 'New' : `${currentTransferIndex + 1} / ${transfers.length}`}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ alignSelf: 'center', px: 1 }}
                />
              )}
              <Tooltip title="Next">
                <span>
                  <Button variant="outlined" size="small" endIcon={<ChevronRightIcon />} onClick={handleNext} disabled={currentTransferIndex >= transfers.length - 1}>
                    Next
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Last">
                <span>
                  <Button variant="outlined" size="small" endIcon={<LastPageIcon />} onClick={handleLast} disabled={currentTransferIndex >= transfers.length - 1}>
                    Last
                  </Button>
                </span>
              </Tooltip>
            </Box>

            {/* Main Actions */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button
                variant="outlined"
                onClick={handleNew}
                sx={{ borderColor: 'secondary.main', color: 'secondary.main' }}
              >
                New
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
                  '&:hover': { background: 'linear-gradient(45deg, #7B1FA2 30%, #C2185B 90%)' },
                }}
              >
                {loading ? 'Saving…' : 'Save'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                color="secondary"
              >
                Print
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<ClearIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </Box>
          </Box>

        </Stack>
      </Container>
      {SnackbarEl}
    </DashboardLayout>
  );
}
