'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Collapse,
  Tooltip,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  ShoppingBag as ShoppingBagIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  Label as LabelIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Receipt as ReceiptIcon,
  CreditCard as CreditCardIcon,
  TableChart as TableChartIcon,
  MenuBook as MenuBookIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Store as StoreIcon,
  AssignmentReturn as AssignmentReturnIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  setActiveTab,
  expandedDropdowns,
  setExpandedDropdowns,
  user,
  handleLogout
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: DashboardIcon, category: 'main' },
    
    // Customer Management
    { id: 'customercategory', name: 'Customer Categories', icon: LabelIcon, category: 'customer-management', parent: 'Customer Management' },
    { id: 'customers', name: 'Customer List', icon: PeopleIcon, category: 'customer-management', parent: 'Customer Management' },
    
    // Product Management
    { id: 'categories', name: 'Category Management', icon: FolderIcon, category: 'product-management', parent: 'Product Management' },
    { id: 'sub-categories', name: 'Sub Category Management', icon: FolderOpenIcon, category: 'product-management', parent: 'Product Management' },
    { id: 'products', name: 'Product List', icon: InventoryIcon, category: 'product-management', parent: 'Product Management' },
    
    // Financial Management
    { id: 'ledger', name: 'Ledger', icon: DescriptionIcon, category: 'financial', parent: 'Finance' },
    { id: 'expense-titles', name: 'Expense Titles', icon: LabelIcon, category: 'financial', parent: 'Finance' },
    { id: 'expenses', name: 'Expense Management', icon: AttachMoneyIcon, category: 'financial', parent: 'Finance' },
    { id: 'journal', name: 'Journal Entries', icon: MenuBookIcon, category: 'financial', parent: 'Finance' },
    { id: 'day-end', name: 'Day End / Day Close', icon: CalendarIcon, category: 'financial', parent: 'Finance' },
    
    // Sales Operations
    { id: 'new-sale', name: 'New Sale', icon: AddIcon, category: 'sales-operations', parent: 'Sales' },
    { id: 'sales', name: 'Sales', icon: ShoppingCartIcon, category: 'sales-operations', parent: 'Sales' },
    { id: 'hold-bills', name: 'Hold Bills', icon: InventoryIcon, category: 'sales-operations', parent: 'Sales' },
    { id: 'sale-returns', name: 'Sale Returns', icon: CloseIcon, category: 'sales-operations', parent: 'Sales' },
    { id: 'loaders', name: 'Loader/Transport', icon: LocalShippingIcon, category: 'sales-operations', parent: 'Sales' },
    { id: 'orders', name: 'Orders', icon: DescriptionIcon, category: 'sales-operations', parent: 'Sales' },
    { id: 'quotations', name: 'Quotations', icon: ReceiptIcon, category: 'sales-operations', parent: 'Sales' },
    
    // Purchase Operations
    { id: 'purchases', name: 'Purchase Management', icon: ShoppingBagIcon, category: 'purchase-operations', parent: 'Purchase' },
    { id: 'purchase-returns', name: 'Purchase Returns', icon: AssignmentReturnIcon, category: 'purchase-operations', parent: 'Purchase' },
    { id: 'vehicles', name: 'Vehicle Management', icon: LocalShippingIcon, category: 'purchase-operations', parent: 'Purchase' },
    { id: 'purchase-details', name: 'Purchase Details', icon: TableChartIcon, category: 'purchase-operations', parent: 'Purchase' },
    
    // Cargo Operations
    { id: 'cargo', name: 'Cargo Management', icon: LocalShippingIcon, category: 'cargo-operations', parent: 'Cargo' },
    
    // Reports
    { id: 'reports-dashboard', name: 'Reports Dashboard', icon: DashboardIcon, category: 'reports', parent: 'Reports' },
    { id: 'sales-by-date', name: 'Sales (By Date)', icon: CalendarIcon, category: 'reports', parent: 'Reports' },
    { id: 'sales-by-customer', name: 'Sales (Customer Wise)', icon: PeopleIcon, category: 'reports', parent: 'Reports' },
    { id: 'customers-balance', name: 'Customers Balance', icon: AttachMoneyIcon, category: 'reports', parent: 'Reports' },
    { id: 'customer-ledger', name: 'Customer Ledger', icon: DescriptionIcon, category: 'reports', parent: 'Reports' },
    { id: 'purchases-by-date', name: 'Purchases (By Date)', icon: CalendarIcon, category: 'reports', parent: 'Reports' },
    { id: 'purchases-by-supplier', name: 'Purchases (Supplier Wise)', icon: ShoppingBagIcon, category: 'reports', parent: 'Reports' },
    { id: 'expenses-by-date', name: 'Expenses Report', icon: TrendingUpIcon, category: 'reports', parent: 'Reports' },
    
    // System Management
    { id: 'usermanagement', name: 'User Management', icon: PersonIcon, category: 'system', parent: 'System' },
    { id: 'stores', name: 'Store Management', icon: StoreIcon, category: 'system', parent: 'System' },
    { id: 'store-stock', name: 'Store Stock', icon: InventoryIcon, category: 'system', parent: 'System' },
    { id: 'stock-transfer', name: 'Stock Transfer', icon: SwapHorizIcon, category: 'system', parent: 'System' }
  ];

  const toggleDropdown = (category) => {
    setExpandedDropdowns(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleNavigation = (itemId) => {
    setActiveTab(itemId);
    
    // Navigate to specific pages
    if (itemId === 'usermanagement') {
      router.push('/dashboard/usermanagement');
    } else if (itemId === 'customercategory') {
      router.push('/dashboard/customercategory');
    } else if (itemId === 'customers') {
      router.push('/dashboard/customers');
    } else if (itemId === 'categories') {
      router.push('/dashboard/categories');
    } else if (itemId === 'sub-categories') {
      router.push('/dashboard/subcategories');
    } else if (itemId === 'products') {
      router.push('/dashboard/products');
    } else if (itemId === 'purchases') {
      router.push('/dashboard/purchases');
    } else if (itemId === 'purchase-returns') {
      router.push('/dashboard/purchase-returns');
    } else if (itemId === 'vehicles') {
      router.push('/dashboard/vehicles');
    } else if (itemId === 'ledger') {
      router.push('/dashboard/finance');
    } else if (itemId === 'sales') {
      router.push('/dashboard/sales');
    } else if (itemId === 'hold-bills') {
      router.push('/dashboard/hold-bills');
    } else if (itemId === 'sale-returns') {
      router.push('/dashboard/sale-returns');
    } else if (itemId === 'loaders') {
      router.push('/dashboard/loaders');
    } else if (itemId === 'expense-titles') {
      router.push('/dashboard/expense-titles');
    } else if (itemId === 'expenses') {
      router.push('/dashboard/expenses');
    } else if (itemId === 'journal') {
      router.push('/dashboard/journal');
    } else if (itemId === 'day-end') {
      router.push('/dashboard/day-end');
    } else if (itemId === 'cargo') {
      router.push('/dashboard/cargo');
    } else if (itemId === 'new-sale') {
      router.push('/dashboard/sales');
    } else if (itemId === 'orders') {
      router.push('/dashboard/orders');
    } else if (itemId === 'quotations') {
      router.push('/dashboard/quotations');
    } else if (itemId === 'reports-dashboard') {
      router.push('/dashboard/reports');
    } else if (itemId === 'sales-by-date') {
      router.push('/dashboard/reports/sales-by-date');
    } else if (itemId === 'sales-by-customer') {
      router.push('/dashboard/reports/sales-by-customer');
    } else if (itemId === 'customers-balance') {
      router.push('/dashboard/reports/customers-balance');
    } else if (itemId === 'customer-ledger') {
      router.push('/dashboard/reports/customer-ledger');
    } else if (itemId === 'purchases-by-date') {
      router.push('/dashboard/reports/purchases-by-date');
    } else if (itemId === 'purchases-by-supplier') {
      router.push('/dashboard/reports/purchases-by-supplier');
    } else if (itemId === 'expenses-by-date') {
      router.push('/dashboard/reports/expenses-by-date');
    } else if (itemId === 'stores') {
      router.push('/dashboard/stores');
    } else if (itemId === 'store-stock') {
      router.push('/dashboard/store-stock');
    } else if (itemId === 'stock-transfer') {
      router.push('/dashboard/stock-transfer');
    } else if (itemId === 'dashboard') {
      router.push('/dashboard');
    }
    // For other items, they will show "Under Development" message
    
    // Close sidebar on mobile
    setSidebarOpen(false);
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const drawerWidth = isMobile ? 320 : (sidebarCollapsed ? 72 : 320);

  const renderMenuSection = (category, title, icon) => {
    const items = menuItems.filter(item => item.category === category);
    const isExpanded = expandedDropdowns[category];
    const collapsed = sidebarCollapsed && !isMobile;

    // Collapsed: show icons only with tooltips
    if (collapsed) {
      return (
        <Box key={category} sx={{ mb: 0.5 }}>
          {items.map((item) => (
            <Tooltip key={item.id} title={`${title} › ${item.name}`} placement="right">
              <ListItemButton
                onClick={() => handleNavigation(item.id)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  justifyContent: 'center',
                  minHeight: 44,
                  backgroundColor: activeTab === item.id ? 'primary.light' : 'transparent',
                  color: activeTab === item.id ? 'primary.contrastText' : 'text.primary',
                  '&:hover': { backgroundColor: activeTab === item.id ? 'primary.main' : 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, color: 'inherit', justifyContent: 'center' }}>
                  <item.icon fontSize="small" />
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          ))}
        </Box>
      );
    }

    return (
      <Box key={category}>
        <ListItemButton
          onClick={() => toggleDropdown(category)}
          sx={{
            borderRadius: 2,
            mb: 1,
            '&:hover': { backgroundColor: 'action.hover' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {icon}
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {title}
              </Typography>
            }
          />
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>

        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {items.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                sx={{
                  pl: 4,
                  borderRadius: 2,
                  mb: 0.5,
                  backgroundColor: activeTab === item.id ? 'primary.light' : 'transparent',
                  color: activeTab === item.id ? 'primary.contrastText' : 'text.primary',
                  '&:hover': {
                    backgroundColor: activeTab === item.id ? 'primary.main' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: activeTab === item.id ? 600 : 400 }}>
                      {item.name}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Collapse>
      </Box>
    );
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{
        p: sidebarCollapsed && !isMobile ? 1.5 : 3,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed && !isMobile ? 'center' : 'space-between',
        minHeight: 72,
        transition: 'padding 0.3s ease',
      }}>
        {(!sidebarCollapsed || isMobile) && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
              <DashboardIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{
                fontWeight: 'bold',
                fontSize: '0.85rem',
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Ittefaq Iron and Cement Store
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                POS System
              </Typography>
            </Box>
          </Box>
        )}

        {sidebarCollapsed && !isMobile && (
          <Tooltip title="Expand Sidebar" placement="right">
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, cursor: 'pointer' }} onClick={() => setSidebarCollapsed(false)}>
              <DashboardIcon fontSize="small" />
            </Avatar>
          </Tooltip>
        )}

        {!isMobile && !sidebarCollapsed && (
          <Tooltip title="Collapse Sidebar">
            <IconButton onClick={() => setSidebarCollapsed(true)} size="small">
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
        )}

        {isMobile && (
          <IconButton onClick={() => setSidebarOpen(false)}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Search — hidden when collapsed */}
      {(!sidebarCollapsed || isMobile) && <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ bgcolor: 'action.hover', borderRadius: 2, '& fieldset': { border: 'none' } }}
        />
      </Box>}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List>
          {/* Search Results */}
          {searchQuery.trim() && (
            <Box sx={{ mb: 1 }}>
              {menuItems
                .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .length === 0 ? (
                  <Typography variant="body2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
                    No results found
                  </Typography>
                ) : (
                  menuItems
                    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
                      <ListItemButton
                        key={item.id}
                        onClick={() => { handleNavigation(item.id); setSearchQuery(''); }}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          backgroundColor: activeTab === item.id ? 'primary.light' : 'transparent',
                          color: activeTab === item.id ? 'primary.contrastText' : 'text.primary',
                          '&:hover': {
                            backgroundColor: activeTab === item.id ? 'primary.main' : 'action.hover',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                          <item.icon />
                        </ListItemIcon>
                        <ListItemText
                          primary={<Typography variant="body2">{item.name}</Typography>}
                          secondary={item.parent && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item.parent}
                            </Typography>
                          )}
                        />
                      </ListItemButton>
                    ))
                )}
            </Box>
          )}

          {/* Normal menu — hidden when searching */}
          {!searchQuery.trim() && <>

          {/* Dashboard */}
          <Box sx={{ mb: 2 }}>
            {(!sidebarCollapsed || isMobile) && (
              <Typography variant="overline" sx={{
                px: 2, py: 1, color: 'text.secondary', fontWeight: 600, letterSpacing: 1
              }}>
                Overview
              </Typography>
            )}
            {menuItems.filter(item => item.category === 'main').map((item) => (
              (sidebarCollapsed && !isMobile) ? (
                <Tooltip key={item.id} title={item.name} placement="right">
                  <ListItemButton
                    onClick={() => handleNavigation(item.id)}
                    sx={{
                      borderRadius: 2, mb: 0.5, justifyContent: 'center', minHeight: 44,
                      backgroundColor: activeTab === item.id ? 'primary.light' : 'transparent',
                      color: activeTab === item.id ? 'primary.contrastText' : 'text.primary',
                      '&:hover': { backgroundColor: activeTab === item.id ? 'primary.main' : 'action.hover' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, color: 'inherit', justifyContent: 'center' }}>
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              ) : (
                <ListItemButton
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  sx={{
                    borderRadius: 2, mb: 0.5,
                    backgroundColor: activeTab === item.id ? 'primary.light' : 'transparent',
                    color: activeTab === item.id ? 'primary.contrastText' : 'text.primary',
                    '&:hover': { backgroundColor: activeTab === item.id ? 'primary.main' : 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: activeTab === item.id ? 600 : 400 }}>
                        {item.name}
                      </Typography>
                    }
                  />
                </ListItemButton>
              )
            ))}
          </Box>

          {/* Menu Sections */}
          {renderMenuSection('customer-management', 'Customer Management', <PeopleIcon />)}
          {renderMenuSection('product-management', 'Product Management', <InventoryIcon />)}
          {renderMenuSection('financial', 'Finance', <AttachMoneyIcon />)}
          {renderMenuSection('sales-operations', 'Sales', <ShoppingCartIcon />)}
          {renderMenuSection('purchase-operations', 'Purchase', <ShoppingBagIcon />)}
          {renderMenuSection('cargo-operations', 'Cargo', <LocalShippingIcon />)}
          {renderMenuSection('reports', 'Reports', <DashboardIcon />)}

          {/* System */}
          <Box sx={{ mb: 2 }}>
            {(!sidebarCollapsed || isMobile) && (
              <Typography variant="overline" sx={{
                px: 2, py: 1, color: 'text.secondary', fontWeight: 600, letterSpacing: 1
              }}>
                System
              </Typography>
            )}
            {menuItems.filter(item => item.category === 'system').map((item) => (
              (sidebarCollapsed && !isMobile) ? (
                <Tooltip key={item.id} title={item.name} placement="right">
                  <ListItemButton
                    onClick={() => handleNavigation(item.id)}
                    sx={{
                      borderRadius: 2, mb: 0.5, justifyContent: 'center', minHeight: 44,
                      backgroundColor: activeTab === item.id ? 'primary.light' : 'transparent',
                      color: activeTab === item.id ? 'primary.contrastText' : 'text.primary',
                      '&:hover': { backgroundColor: activeTab === item.id ? 'primary.main' : 'action.hover' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, color: 'inherit', justifyContent: 'center' }}>
                      <item.icon fontSize="small" />
                    </ListItemIcon>
                  </ListItemButton>
                </Tooltip>
              ) : (
                <ListItemButton
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  sx={{
                    borderRadius: 2, mb: 0.5,
                    backgroundColor: activeTab === item.id ? 'primary.light' : 'transparent',
                    color: activeTab === item.id ? 'primary.contrastText' : 'text.primary',
                    '&:hover': { backgroundColor: activeTab === item.id ? 'primary.main' : 'action.hover' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    <item.icon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: activeTab === item.id ? 600 : 400 }}>
                        {item.name}
                      </Typography>
                    }
                  />
                </ListItemButton>
              )
            ))}
          </Box>
          </>}
        </List>
      </Box>

      {/* User Profile */}
      <Box sx={{ p: sidebarCollapsed && !isMobile ? 1 : 2, borderTop: 1, borderColor: 'divider' }}>
        {(sidebarCollapsed && !isMobile) ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Tooltip title={user?.email} placement="right">
              <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, cursor: 'default' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </Avatar>
            </Tooltip>
            <Tooltip title="Logout" placement="right">
              <IconButton onClick={handleLogout} size="small">
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{
            p: 2, borderRadius: 2, border: 1, borderColor: 'divider',
            display: 'flex', alignItems: 'center'
          }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 40, height: 40 }}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {user?.email}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase' }}>
                {user?.role}
              </Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton onClick={handleLogout} size="small">
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: 'width 0.3s ease',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 1,
            borderColor: 'divider',
            overflowX: 'hidden',
            transition: 'width 0.3s ease',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
