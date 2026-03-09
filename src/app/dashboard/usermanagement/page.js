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
  Chip,
  Snackbar,
  Alert,
  InputAdornment,
  CircularProgress,
  Stack,
  Tooltip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  AccessTime as ClockIcon,
  VerifiedUser as VerifiedIcon,
  Block as BlockIcon,
} from '@mui/icons-material';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'SALESMAN',
    status: 'ACTIVE',
    is_verified: false,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ full_name: '', email: '', password: '', role: 'SALESMAN', status: 'ACTIVE', is_verified: false });
  };

  const handleCloseForm = () => {
    setShowUserForm(false);
    setEditingUser(null);
    resetForm();
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const newUser = await response.json();
        setUsers(prev => [...prev, newUser]);
        handleCloseForm();
        showSnackbar('User created successfully!');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'Failed to create user', 'error');
      }
    } catch {
      showSnackbar('Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUser.user_id, ...formData }),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(prev => prev.map(u => u.user_id === editingUser.user_id ? updatedUser : u));
        handleCloseForm();
        showSnackbar('User updated successfully!');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'Failed to update user', 'error');
      }
    } catch {
      showSnackbar('Failed to update user', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name.trim()) { showSnackbar('Full name is required', 'error'); return; }
    if (!formData.email.trim()) { showSnackbar('Email is required', 'error'); return; }
    if (!editingUser && !formData.password.trim()) { showSnackbar('Password is required', 'error'); return; }
    if (editingUser) { await handleUpdateUser(); } else { await handleAddUser(); }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      password: user.password || '',
      role: user.role || 'SALESMAN',
      status: user.status || 'ACTIVE',
      is_verified: user.is_verified || false,
    });
    setShowUserForm(true);
  };

  const handleDeleteConfirm = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`/api/users?id=${userToDelete.user_id}`, { method: 'DELETE' });
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.user_id !== userToDelete.user_id));
        showSnackbar('User deleted successfully!');
      } else {
        const error = await response.json();
        showSnackbar(error.error || 'Failed to delete user', 'error');
      }
    } catch {
      showSnackbar('Failed to delete user', 'error');
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = (userId) => {
    setUsers(prev => prev.map(u =>
      u.user_id === userId
        ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
        : u
    ));
  };

  const getRoleChipProps = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return { color: 'error', label: 'Super Admin', icon: <ShieldIcon /> };
      case 'ADMIN':       return { color: 'primary', label: 'Admin', icon: <ShieldIcon /> };
      case 'SALESMAN':    return { color: 'success', label: 'Salesman', icon: <PersonIcon /> };
      default:            return { color: 'default', label: role, icon: <PersonIcon /> };
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesSearch =
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesVerified =
        verifiedFilter === 'all' ||
        (verifiedFilter === 'verified' && user.is_verified) ||
        (verifiedFilter === 'not-verified' && !user.is_verified);
      return matchesSearch && matchesRole && matchesStatus && matchesVerified;
    })
    .map((user, idx) => ({ ...user, sequentialId: idx + 1 }));

  const statCards = [
    {
      label: 'Total Users',
      value: users.length,
      icon: <PersonIcon />,
      gradient: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.status === 'ACTIVE').length,
      icon: <CheckCircleIcon />,
      gradient: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
    },
    {
      label: 'Verified Users',
      value: users.filter(u => u.is_verified).length,
      icon: <VerifiedIcon />,
      gradient: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
    },
    {
      label: 'Online Today',
      value: users.filter(u => u.last_logged_in &&
        new Date(u.last_logged_in).toDateString() === new Date().toDateString()).length,
      icon: <ClockIcon />,
      gradient: 'linear-gradient(45deg, #FF9800 30%, #F44336 90%)',
    },
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
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Manage system users and their permissions
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowUserForm(true)}
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
              Add New User
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
                        <Typography variant="body2" sx={{ opacity: 0.85 }}>{stat.label}</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
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
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Filters</Typography>
                <Button size="small" onClick={() => {
                  setSearchTerm(''); setRoleFilter('all');
                  setStatusFilter('all'); setVerifiedFilter('all');
                }}>
                  Clear All
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth size="small" label="Search"
                    placeholder="Search by name or email…"
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
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} label="Role">
                      <MenuItem value="all">All Roles</MenuItem>
                      <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="SALESMAN">Salesman</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="INACTIVE">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Verification</InputLabel>
                    <Select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value)} label="Verification">
                      <MenuItem value="all">All Users</MenuItem>
                      <MenuItem value="verified">Verified</MenuItem>
                      <MenuItem value="not-verified">Not Verified</MenuItem>
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
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Users List</Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredUsers.length} of {users.length} users
              </Typography>
            </Box>
            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Verified</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Last Login</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box sx={{ py: 8, textAlign: 'center' }}>
                          <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            No users found
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Add your first user to get started.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => {
                      const roleProps = getRoleChipProps(user.role);
                      return (
                        <TableRow key={user.user_id} sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{
                                background: 'linear-gradient(135deg, #2196F3, #3F51B5)',
                                width: 38, height: 38, fontSize: 16, fontWeight: 'bold',
                              }}>
                                {user.full_name.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {user.full_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  #{user.sequentialId}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{user.email}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              icon={roleProps.icon}
                              label={roleProps.label}
                              color={roleProps.color}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={user.status}
                              color={user.status === 'ACTIVE' ? 'success' : 'error'}
                              variant="filled"
                            />
                          </TableCell>
                          <TableCell>
                            {user.is_verified ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'success.main' }}>
                                <CheckCircleIcon fontSize="small" />
                                <Typography variant="body2">Verified</Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
                                <CancelIcon fontSize="small" />
                                <Typography variant="body2">Not Verified</Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {user.last_logged_in
                                ? new Date(user.last_logged_in).toLocaleString()
                                : 'Never'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Edit">
                              <IconButton size="small" color="primary" onClick={() => handleEditUser(user)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={user.status === 'ACTIVE' ? 'warning' : 'success'}
                                onClick={() => handleToggleStatus(user.user_id)}
                              >
                                {user.status === 'ACTIVE'
                                  ? <BlockIcon fontSize="small" />
                                  : <CheckIcon fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(user)}>
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

      {/* ── Add / Edit User Dialog ── */}
      <Dialog
        open={showUserForm}
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
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                {editingUser ? 'Edit User' : 'Add New User'}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                {editingUser ? 'Update user information' : 'Create a new system user'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseForm} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5} sx={{ mt: 0.5 }}>

            {/* Full Name */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
                placeholder="Enter full name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="Enter email address"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Password */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={editingUser ? 'Password (leave blank to keep)' : 'Password'}
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required={!editingUser}
                placeholder="Enter password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Role */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>User Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  label="User Role"
                >
                  <MenuItem value="SALESMAN">Salesman</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Account Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  label="Account Status"
                >
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Email Verified */}
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_verified}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_verified: e.target.checked }))}
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Email Verified</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.is_verified ? 'User email is verified' : 'User email not yet verified'}
                    </Typography>
                  </Box>
                }
              />
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button onClick={handleCloseForm} variant="outlined">Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<CheckIcon />}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              '&:hover': { background: 'linear-gradient(45deg, #1976D2 30%, #7B1FA2 90%)' },
            }}
          >
            {editingUser ? 'Update User' : 'Create User'}
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
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{userToDelete?.full_name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
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
