'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard-layout';
import {
  Box,
  Container,
  Typography,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Snackbar,
  Alert,
  InputAdornment,
  CircularProgress,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as TruckIcon,
  Search as SearchIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  TrendingUp as NetIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

export default function CargoPage() {
  const [cargo, setCargo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCargoForm, setShowCargoForm] = useState(false);
  const [editingCargo, setEditingCargo] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_no: '',
    total_cargo_fare: 0,
    exp1: 0, exp2: 0, exp3: 0,
    exp4: 0, exp5: 0, exp6: 0,
    others: 0,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cargoToDelete, setCargoToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cargo');
      if (response.ok) {
        const data = await response.json();
        const cargoData = data.cargo || data;
        setCargo(Array.isArray(cargoData) ? cargoData : []);
      }
    } catch (error) {
      console.error('Error fetching cargo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCargo = async () => {
    try {
      const response = await fetch('/api/cargo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const newCargo = await response.json();
        setCargo(prev => [...prev, newCargo]);
        handleCloseForm();
        showSnackbar('Cargo added successfully!');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'Failed to create cargo', 'error');
      }
    } catch {
      showSnackbar('Failed to create cargo', 'error');
    }
  };

  const handleUpdateCargo = async () => {
    try {
      const response = await fetch('/api/cargo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCargo.cargo_id, ...formData }),
      });
      if (response.ok) {
        const updatedCargo = await response.json();
        setCargo(prev =>
          prev.map(item => item.cargo_id === editingCargo.cargo_id ? updatedCargo : item)
        );
        handleCloseForm();
        showSnackbar('Cargo updated successfully!');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'Failed to update cargo', 'error');
      }
    } catch {
      showSnackbar('Failed to update cargo', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.vehicle_no.trim()) {
      showSnackbar('Vehicle number is required', 'error');
      return;
    }
    if (editingCargo) {
      await handleUpdateCargo();
    } else {
      await handleAddCargo();
    }
  };

  const handleEditCargo = (cargoItem) => {
    setEditingCargo(cargoItem);
    setFormData({
      vehicle_no: cargoItem.vehicle_no || '',
      total_cargo_fare: cargoItem.total_cargo_fare || 0,
      exp1: cargoItem.exp1 || 0, exp2: cargoItem.exp2 || 0,
      exp3: cargoItem.exp3 || 0, exp4: cargoItem.exp4 || 0,
      exp5: cargoItem.exp5 || 0, exp6: cargoItem.exp6 || 0,
      others: cargoItem.others || 0,
    });
    setShowCargoForm(true);
  };

  const handleDeleteConfirm = (cargoItem) => {
    setCargoToDelete(cargoItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCargo = async () => {
    if (!cargoToDelete) return;
    try {
      const response = await fetch(`/api/cargo?id=${cargoToDelete.cargo_id}`, { method: 'DELETE' });
      if (response.ok) {
        setCargo(prev => prev.filter(item => item.cargo_id !== cargoToDelete.cargo_id));
        showSnackbar('Cargo deleted successfully!');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'Failed to delete cargo', 'error');
      }
    } catch {
      showSnackbar('Failed to delete cargo', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setCargoToDelete(null);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleCloseForm = () => {
    setShowCargoForm(false);
    setEditingCargo(null);
    setFormData({
      vehicle_no: '', total_cargo_fare: 0,
      exp1: 0, exp2: 0, exp3: 0, exp4: 0, exp5: 0, exp6: 0, others: 0,
    });
  };

  const calculateTotalExpenses = (item) =>
    ['exp1', 'exp2', 'exp3', 'exp4', 'exp5', 'exp6', 'others']
      .reduce((sum, key) => sum + (parseFloat(item[key]) || 0), 0);

  const calculateNetAmount = (item) =>
    (parseFloat(item.total_cargo_fare) || 0) - calculateTotalExpenses(item);

  const filteredAndSortedCargo = cargo
    .filter(item =>
      (item.vehicle_no || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = sortBy === 'created_at' ? new Date(a[sortBy]) : a[sortBy];
      let bVal = sortBy === 'created_at' ? new Date(b[sortBy]) : b[sortBy];
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    })
    .map((item, idx) => ({ ...item, sequentialId: idx + 1 }));

  const statCards = [
    {
      label: 'Total Records',
      value: cargo.length,
      icon: <TruckIcon />,
      gradient: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    },
    {
      label: 'Total Fare',
      value: cargo.reduce((s, i) => s + (parseFloat(i.total_cargo_fare) || 0), 0).toLocaleString(),
      icon: <MoneyIcon />,
      gradient: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
    },
    {
      label: 'Total Expenses',
      value: cargo.reduce((s, i) => s + calculateTotalExpenses(i), 0).toLocaleString(),
      icon: <ReceiptIcon />,
      gradient: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
    },
    {
      label: 'Net Amount',
      value: cargo.reduce((s, i) => s + calculateNetAmount(i), 0).toLocaleString(),
      icon: <NetIcon />,
      gradient: 'linear-gradient(45deg, #FF9800 30%, #F44336 90%)',
    },
  ];

  const expenseFields = [
    { name: 'exp1', label: 'Expense 1' },
    { name: 'exp2', label: 'Expense 2' },
    { name: 'exp3', label: 'Expense 3' },
    { name: 'exp4', label: 'Expense 4' },
    { name: 'exp5', label: 'Expense 5' },
    { name: 'exp6', label: 'Expense 6' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={56} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth={false} sx={{ py: 4 }}>
        <Stack spacing={4}>

          {/* ── Header ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Cargo Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Manage cargo records and expenses
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCargoForm(true)}
              sx={{
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                boxShadow: '0 3px 5px 2px rgba(33,150,243,.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #7B1FA2 90%)',
                  transform: 'scale(1.03)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              Add New Cargo
            </Button>
          </Box>

          {/* ── Stats Cards ── */}
          <Grid container spacing={3}>
            {statCards.map((stat) => (
              <Grid item xs={12} sm={6} md={3} key={stat.label}>
                <Card sx={{ background: stat.gradient, color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 2 }}>
                        {stat.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {stat.value}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* ── Filters ── */}
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Filters &amp; Search
                </Typography>
                <Button size="small" onClick={() => { setSearchTerm(''); setSortBy('created_at'); setSortOrder('desc'); }}>
                  Clear All
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search"
                    placeholder="Search by vehicle number…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="created_at">Date Created</MenuItem>
                      <MenuItem value="vehicle_no">Vehicle Number</MenuItem>
                      <MenuItem value="total_cargo_fare">Total Fare</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Order</InputLabel>
                    <Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      label="Order"
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Table ── */}
          <Card>
            <Box sx={{
              px: 3, py: 2,
              borderBottom: 1, borderColor: 'divider',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Cargo Records</Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredAndSortedCargo.length} of {cargo.length} records
              </Typography>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 750 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Vehicle</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Total Fare</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Expenses</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Net Amount</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Created</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedCargo.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                          <TruckIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No cargo records found
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Add your first cargo record to get started.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedCargo.map((item) => {
                      const net = calculateNetAmount(item);
                      return (
                        <TableRow key={item.cargo_id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{
                                background: 'linear-gradient(135deg, #2196F3, #3F51B5)',
                                width: 38, height: 38,
                              }}>
                                <TruckIcon fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.vehicle_no}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  #{item.sequentialId}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {parseFloat(item.total_cargo_fare).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: 'error.main' }}>
                              {calculateTotalExpenses(item).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{
                              fontWeight: 'bold',
                              color: net >= 0 ? 'success.main' : 'error.main',
                            }}>
                              {net.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit">
                              <IconButton size="small" color="primary" onClick={() => handleEditCargo(item)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(item)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

        </Stack>
      </Container>

      {/* ── Add / Edit Dialog ── */}
      <Dialog
        open={showCargoForm}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
          color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              <TruckIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {editingCargo ? 'Edit Cargo Record' : 'Add New Cargo Record'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {editingCargo ? 'Update cargo information' : 'Create a new cargo record'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseForm} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3} sx={{ mt: 0.5 }}>

            {/* Vehicle Number */}
            <TextField
              fullWidth
              label="Vehicle Number"
              name="vehicle_no"
              value={formData.vehicle_no}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicle_no: e.target.value }))}
              required
              placeholder="Enter vehicle number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TruckIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Total Cargo Fare */}
            <TextField
              fullWidth
              label="Total Cargo Fare"
              name="total_cargo_fare"
              type="number"
              inputProps={{ step: '0.01', min: 0 }}
              value={formData.total_cargo_fare}
              onChange={handleFormChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
              }}
            />

            {/* Expenses 1–6 */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Expenses
              </Typography>
              <Grid container spacing={2}>
                {expenseFields.map(({ name, label }) => (
                  <Grid item xs={12} sm={6} md={4} key={name}>
                    <TextField
                      fullWidth
                      size="small"
                      label={label}
                      name={name}
                      type="number"
                      inputProps={{ step: '0.01', min: 0 }}
                      value={formData[name]}
                      onChange={handleFormChange}
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Other Expenses */}
            <TextField
              fullWidth
              label="Other Expenses"
              name="others"
              type="number"
              inputProps={{ step: '0.01', min: 0 }}
              value={formData.others}
              onChange={handleFormChange}
              placeholder="0.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
              }}
            />

          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseForm} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<CheckIcon />}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              '&:hover': { background: 'linear-gradient(45deg, #1976D2 30%, #7B1FA2 90%)' },
            }}
          >
            {editingCargo ? 'Update Cargo' : 'Create Cargo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Delete Cargo Record</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the record for{' '}
            <strong>{cargoToDelete?.vehicle_no}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteCargo} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </DashboardLayout>
  );
}
