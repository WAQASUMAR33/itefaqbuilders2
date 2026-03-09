'use client';

import { useRouter } from 'next/navigation';
import DashboardLayout from '../components/dashboard-layout';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Avatar,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Group as UsersIcon,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as DollarIcon,
  Description as FileTextIcon,
  BarChart as BarChartIcon,
  ArrowForward as ArrowForwardIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

const reports = [
  {
    id: 'sales-by-date',
    title: 'Sales Report (By Date)',
    description: 'View sales transactions within a date range',
    icon: <CalendarIcon />,
    gradient: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
    path: '/dashboard/reports/sales-by-date',
  },
  {
    id: 'sales-by-customer',
    title: 'Sales Report (Customer Wise)',
    description: 'View sales grouped by customers',
    icon: <UsersIcon />,
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #E91E63 100%)',
    path: '/dashboard/reports/sales-by-customer',
  },
  {
    id: 'customers-balance',
    title: 'Customers Balance Report',
    description: 'View all customers with their balance',
    icon: <UsersIcon />,
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #00BCD4 100%)',
    path: '/dashboard/reports/customers-balance',
  },
  {
    id: 'customer-ledger',
    title: 'Customer Ledger',
    description: 'View detailed ledger for a specific customer',
    icon: <FileTextIcon />,
    gradient: 'linear-gradient(135deg, #3F51B5 0%, #2196F3 100%)',
    path: '/dashboard/reports/customer-ledger',
  },
  {
    id: 'purchases-by-date',
    title: 'Purchase Report (By Date)',
    description: 'View purchases within a date range',
    icon: <ShoppingBagIcon />,
    gradient: 'linear-gradient(135deg, #FF9800 0%, #F44336 100%)',
    path: '/dashboard/reports/purchases-by-date',
  },
  {
    id: 'purchases-by-supplier',
    title: 'Purchase Report (Supplier Wise)',
    description: 'View purchases grouped by suppliers',
    icon: <ShoppingCartIcon />,
    gradient: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
    path: '/dashboard/reports/purchases-by-supplier',
  },
  {
    id: 'expenses-by-date',
    title: 'Expense Report',
    description: 'View expenses within a date range',
    icon: <DollarIcon />,
    gradient: 'linear-gradient(135deg, #F44336 0%, #E91E63 100%)',
    path: '/dashboard/reports/expenses-by-date',
  },
  {
    id: 'stock-report',
    title: 'Stock Report',
    description: 'View inventory levels, filter low stock & out-of-stock items, and print',
    icon: <InventoryIcon />,
    gradient: 'linear-gradient(135deg, #00897B 0%, #26A69A 100%)',
    path: '/dashboard/reports/stock-report',
  },
];

export default function ReportsPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <Container maxWidth={false} sx={{ py: 4 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              Reports Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              Generate and view various business reports
            </Typography>
          </Box>
          <Avatar sx={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #2196F3 0%, #9C27B0 100%)',
          }}>
            <BarChartIcon />
          </Avatar>
        </Box>

        {/* ── Report Cards Grid ── */}
        <Grid container spacing={3}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} lg={4} key={report.id}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => router.push(report.path)}
                  sx={{ height: '100%', p: 0 }}
                >
                  <CardContent sx={{ p: 3, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>

                      {/* Icon */}
                      <Avatar
                        sx={{
                          width: 56, height: 56,
                          background: report.gradient,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          flexShrink: 0,
                        }}
                      >
                        {report.icon}
                      </Avatar>

                      {/* Text */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            lineHeight: 1.3,
                            '.MuiCardActionArea-root:hover &': { color: 'primary.main' },
                            transition: 'color 0.2s',
                          }}
                        >
                          {report.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Box>
                    </Box>

                    {/* View Report link — visible on hover via CSS */}
                    <Box
                      sx={{
                        mt: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'primary.main',
                        opacity: 0,
                        '.MuiCardActionArea-root:hover &': { opacity: 1 },
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        View Report
                      </Typography>
                      <ArrowForwardIcon fontSize="small" />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

      </Container>
    </DashboardLayout>
  );
}
