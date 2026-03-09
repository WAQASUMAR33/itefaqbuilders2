'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard-layout';

// Material-UI imports
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
  Chip,
  InputAdornment,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Divider,
  Avatar,
} from '@mui/material';

import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  LocalShipping as ShippingIcon,
  Undo as UndoIcon,
  History as HistoryIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ShoppingCart as ShoppingCartIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';


export default function PurchaseReturnsPage() {

  // State management
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit'
  const [purchaseReturns, setPurchaseReturns] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReturn, setEditingReturn] = useState(null);

  // Purchase Search State
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [isSearchingPurchase, setIsSearchingPurchase] = useState(false);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form states
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formData, setFormData] = useState({
    purchase_id: '',
    return_date: new Date().toISOString().split('T')[0],
    return_reason: '',
    return_details: [],
    total_return_amount: 0,
    notes: ''
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [returnsRes, purchasesRes, customersRes, productsRes, storesRes] = await Promise.all([
        fetch('/api/purchase-returns'),
        fetch('/api/purchases'),
        fetch('/api/customers'),
        fetch('/api/products'),
        fetch('/api/stores')
      ]);

      const data = await Promise.all([
        returnsRes.json(),
        purchasesRes.json(),
        customersRes.json(),
        productsRes.json(),
        storesRes.json()
      ]);

      setPurchaseReturns(data[0] || []);
      setPurchases(data[1] || []);
      setCustomers(data[2] || []);
      setProducts(data[3] || []);

      const storesResponse = data[4];
      const storesData = storesResponse.success ? storesResponse.data : [];
      setStores(Array.isArray(storesData) ? storesData : []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showSnackbar('Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper functions
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCustomer(null);
    setSelectedStore(null);
    setDateFrom('');
    setDateTo('');
  };

  // Handle purchase selection
  const handlePurchaseSelect = (purchase) => {
    setSelectedPurchase(purchase);
    setFormData(prev => ({
      ...prev,
      purchase_id: purchase.pur_id,
      return_details: purchase.purchase_details?.map(detail => ({
        ...detail,
        return_quantity: 0,
        return_amount: 0,
        max_quantity: detail.qnty || detail.quantity || 0
      })) || []
    }));
    showSnackbar(`Purchase #${purchase.pur_id} loaded successfully`, 'success');
  };

  // Handle purchase search
  const handlePurchaseSearch = async (e) => {
    e?.preventDefault();
    if (!purchaseSearchTerm.trim()) return;

    setIsSearchingPurchase(true);
    try {
      if (!isNaN(purchaseSearchTerm)) {
        const idRes = await fetch(`/api/purchases?id=${purchaseSearchTerm}`);
        if (idRes.ok) {
          const purchase = await idRes.json();
          handlePurchaseSelect(purchase);
          setIsSearchingPurchase(false);
          return;
        }
      }

      const invoiceRes = await fetch(`/api/purchases?invoice=${purchaseSearchTerm}`);
      if (invoiceRes.ok) {
        const purchase = await invoiceRes.json();
        handlePurchaseSelect(purchase);
      } else {
        showSnackbar('Purchase not found with that ID or Invoice', 'warning');
      }
    } catch (error) {
      console.error('Error searching purchase:', error);
      showSnackbar('Error searching purchase', 'error');
    } finally {
      setIsSearchingPurchase(false);
    }
  };

  // Handle return quantity change
  const handleReturnQuantityChange = (index, quantity) => {
    const detail = formData.return_details[index];
    const newQuantity = Math.max(0, Math.min(quantity, detail.max_quantity));

    setFormData(prev => {
      const updatedDetails = prev.return_details.map((item, i) => {
        if (i === index) {
          const returnAmount = newQuantity * parseFloat(item.unit_rate || 0);
          return {
            ...item,
            return_quantity: newQuantity,
            return_amount: returnAmount
          };
        }
        return item;
      });

      const totalReturnAmount = updatedDetails.reduce((sum, item) => sum + (item.return_amount || 0), 0);

      return {
        ...prev,
        return_details: updatedDetails,
        total_return_amount: totalReturnAmount
      };
    });
  };

  // Remove return detail
  const removeReturnDetail = (index) => {
    setFormData(prev => {
      const updatedDetails = prev.return_details.filter((_, i) => i !== index);
      const totalReturnAmount = updatedDetails.reduce((sum, item) => sum + (item.return_amount || 0), 0);

      return {
        ...prev,
        return_details: updatedDetails,
        total_return_amount: totalReturnAmount
      };
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedPurchase) {
      showSnackbar('Please select a purchase to return', 'error');
      return;
    }

    const returningItems = formData.return_details.filter(detail => detail.return_quantity > 0);
    if (returningItems.length === 0) {
      showSnackbar('Please select at least one item to return', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = '/api/purchase-returns';
      const method = editingReturn ? 'PUT' : 'POST';

      const body = editingReturn
        ? { id: editingReturn.id, ...formData, return_details: returningItems }
        : { ...formData, return_details: returningItems };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await fetchData();
        setCurrentView('list');
        setEditingReturn(null);
        setSelectedPurchase(null);
        setFormData({
          purchase_id: '',
          return_date: new Date().toISOString().split('T')[0],
          return_reason: '',
          return_details: [],
          total_return_amount: 0,
          notes: ''
        });

        showSnackbar(
          editingReturn ? 'Purchase return updated successfully' : 'Purchase return created successfully',
          'success'
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        showSnackbar(
          errorData.message || `Error ${editingReturn ? 'updating' : 'creating'} purchase return`,
          'error'
        );
      }
    } catch (error) {
      console.error('Error saving purchase return:', error);
      showSnackbar('Error saving purchase return', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit
  const handleEdit = (purchaseReturn) => {
    setEditingReturn(purchaseReturn);
    const purchase = purchases.find(p => p.pur_id === purchaseReturn.purchase_id);
    if (purchase) {
      setSelectedPurchase(purchase);
    }
    setFormData({
      purchase_id: purchaseReturn.purchase_id,
      return_date: purchaseReturn.return_date.split('T')[0],
      return_reason: purchaseReturn.return_reason || '',
      return_details: purchaseReturn.return_details || [],
      total_return_amount: purchaseReturn.total_return_amount || 0,
      notes: purchaseReturn.notes || ''
    });
    setCurrentView('create');
  };

  // Handle delete
  const handleDelete = async (returnId) => {
    if (window.confirm('Are you sure you want to delete this purchase return? This action will restore stock and reverse ledger entries.')) {
      try {
        const response = await fetch(`/api/purchase-returns?id=${returnId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchData();
          showSnackbar('Purchase return deleted successfully', 'success');
        } else {
          showSnackbar('Error deleting purchase return', 'error');
        }
      } catch (error) {
        console.error('Error deleting purchase return:', error);
        showSnackbar('Error deleting purchase return', 'error');
      }
    }
  };

  // Filter and sort data
  const filteredAndSortedReturns = purchaseReturns
    .filter(returnItem => {
      const purchase = purchases.find(p => p.pur_id === returnItem.purchase_id);
      const customer = customers.find(c => c.cus_id === purchase?.cus_id);

      const matchesSearch = (returnItem.return_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        returnItem.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer?.cus_name?.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCustomer = !selectedCustomer || purchase?.cus_id === selectedCustomer.cus_id;
      const matchesStore = !selectedStore || purchase?.store_id === selectedStore.storeid;
      const matchesDateFrom = !dateFrom || new Date(returnItem.return_date) >= new Date(dateFrom);
      const matchesDateTo = !dateTo || new Date(returnItem.return_date) <= new Date(dateTo);

      return matchesSearch && matchesCustomer && matchesStore && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const modifier = sortOrder === 'asc' ? 1 : -1;

      if (aValue < bValue) return -1 * modifier;
      if (aValue > bValue) return 1 * modifier;
      return 0;
    });

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary" className="animate-pulse">
            Fetching Purchase Returns...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  // Render Purchase Returns List View
  const renderPurchaseReturnsListView = () => (
    <DashboardLayout>
      <Container maxWidth={false} sx={{ py: 4 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Purchase Returns
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Track returns to suppliers and maintain accurate stock levels
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 52, height: 52, background: 'linear-gradient(135deg, #FF9800 0%, #F44336 100%)' }}>
              <UndoIcon />
            </Avatar>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCurrentView('create')}
            >
              Create New Return
            </Button>
          </Stack>
        </Box>

        <Stack spacing={3}>
          {/* Filter Section */}
          <Card>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <FilterIcon color="action" fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Filters</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Button size="small" onClick={clearFilters} startIcon={<ResetIcon />}>Reset</Button>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    placeholder="ID, Reason, Supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ minWidth: 200 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Autocomplete
                    fullWidth
                    size="small"
                    options={customers}
                    getOptionLabel={(option) => option.cus_name || ''}
                    value={selectedCustomer}
                    onChange={(_, newValue) => setSelectedCustomer(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Supplier" placeholder="Filter by supplier" sx={{ minWidth: 200 }} />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="From Date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="To Date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 200 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Table Section */}
          <Card>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Purchase Return Records</Typography>
              <Typography variant="body2" color="text.secondary">{filteredAndSortedReturns.length} records</Typography>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 750 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Return Details</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Supplier</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Original Purchase</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Return Date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Amount</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedReturns.length > 0 ? (
                    filteredAndSortedReturns.map((returnItem) => {
                      const purchase = purchases.find(p => p.pur_id === returnItem.purchase_id);
                      const customer = customers.find(c => c.cus_id === purchase?.cus_id);
                      return (
                        <TableRow key={returnItem.id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar sx={{ width: 36, height: 36, bgcolor: 'warning.light' }}>
                                <UndoIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  PUR-R-{returnItem.id}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 200 }}>
                                  {returnItem.return_reason || 'Manual Return'}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {customer?.cus_name || 'Generic Supplier'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {customer?.cus_phone_no || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={`#${returnItem.purchase_id}`} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(returnItem.return_date).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                              PKR {parseFloat(returnItem.total_return_amount || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Edit">
                                <IconButton size="small" color="primary" onClick={() => handleEdit(returnItem)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" onClick={() => handleDelete(returnItem.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                        <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body1" color="text.secondary">No records found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Stack>
      </Container>
    </DashboardLayout>
  );

  // Render Purchase Return Create View
  const renderPurchaseReturnCreateView = () => (
    <DashboardLayout>
      <Container maxWidth={false} sx={{ py: 4 }}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Tooltip title="Back to list">
            <IconButton onClick={() => setCurrentView('list')}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              {editingReturn ? 'Update Purchase Return' : 'New Purchase Return'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Return items to supplier and update credits
            </Typography>
          </Box>
          {!editingReturn && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                placeholder="Purchase ID..."
                size="small"
                value={purchaseSearchTerm}
                onChange={(e) => setPurchaseSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePurchaseSearch()}
                sx={{ width: 160 }}
              />
              <Button variant="outlined" onClick={handlePurchaseSearch}>
                Load
              </Button>
            </Stack>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Master Data */}
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Return Details</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Return Date"
                      type="date"
                      value={formData.return_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, return_date: e.target.value }))}
                      InputLabelProps={{ shrink: true }}
                      sx={{ minWidth: 180 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      label="Reason for Return"
                      value={formData.return_reason}
                      onChange={(e) => setFormData(prev => ({ ...prev, return_reason: e.target.value }))}
                      sx={{ minWidth: 200 }}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {selectedPurchase ? (
                      <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight="bold">SOURCE PURCHASE</Typography>
                        <Typography variant="body1" fontWeight={600}>#{selectedPurchase.pur_id} — Invoice: {selectedPurchase.invoice_number || 'N/A'}</Typography>
                      </Box>
                    ) : (
                      <Autocomplete
                        fullWidth
                        options={purchases}
                        getOptionLabel={(option) => `#${option.pur_id} - ${option.invoice_number || 'Purch'} - ${parseFloat(option.total_amount).toFixed(2)}`}
                        value={selectedPurchase}
                        onChange={(_, v) => v && handlePurchaseSelect(v)}
                        renderInput={(params) => <TextField {...params} label="Select Purchase Manually" sx={{ minWidth: 200 }} />}
                      />
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
              <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Return Items</Typography>
                <Typography variant="body2" color="text.secondary">Specify quantities to return</Typography>
              </Box>
              <TableContainer>
                <Table sx={{ minWidth: 750 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }} width={50}>#</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Purchase Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Unit Rate</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }} width={140}>Return Qty</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Return Value</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formData.return_details.length > 0 ? (
                      formData.return_details.map((detail, index) => {
                        const product = products.find(p => p.pro_id === detail.pro_id);
                        return (
                          <TableRow key={index} hover>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{product?.pro_title || 'Product Meta Missing'}</Typography>
                              <Typography variant="caption" color="text.secondary">{product?.pro_unit || 'Units'}</Typography>
                            </TableCell>
                            <TableCell align="center">{detail.max_quantity}</TableCell>
                            <TableCell align="right">{parseFloat(detail.unit_rate).toFixed(2)}</TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                value={detail.return_quantity}
                                onChange={(e) => handleReturnQuantityChange(index, parseFloat(e.target.value) || 0)}
                                inputProps={{ style: { textAlign: 'center' } }}
                                sx={{ width: 90 }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                {(detail.return_amount || 0).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Remove">
                                <IconButton size="small" color="error" onClick={() => removeReturnDetail(index)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                          <InventoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                          <Typography variant="body1" color="text.secondary">Load a purchase to see items</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider />
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="flex-end">
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Additional Comments"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                        <Typography variant="h6" fontWeight={600}>Total Return Amount</Typography>
                        <Typography variant="h5" fontWeight={700} color="error.main">
                          PKR {formData.total_return_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        type="submit"
                        disabled={isSubmitting || formData.total_return_amount <= 0}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      >
                        {isSubmitting ? 'Processing...' : (editingReturn ? 'Update Return Record' : 'Submit Return Record')}
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>
            </Card>
          </Stack>
        </form>
      </Container>
    </DashboardLayout>
  );

  return (
    <>
      {currentView === 'list' ? renderPurchaseReturnsListView() : renderPurchaseReturnCreateView()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}