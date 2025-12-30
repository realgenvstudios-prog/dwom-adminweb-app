// Mock data for Finance page
export const financeKPIs = {
  gmv: 120000,
  netRevenue: 95000,
  grossProfit: 0.22,
  avgOrderValue: 85.5,
  mrr: 32000,
  activeSubscriptions: 410,
  failedPaymentRate: 0.018,
};

export const financeChartData = {
  timeSeries: [
    { date: '2025-12-01', gmv: 4000, net: 3200 },
    { date: '2025-12-02', gmv: 4200, net: 3400 },
    { date: '2025-12-03', gmv: 3900, net: 3100 },
    { date: '2025-12-04', gmv: 5000, net: 4100 },
    { date: '2025-12-05', gmv: 4800, net: 3900 },
    { date: '2025-12-06', gmv: 5300, net: 4300 },
    { date: '2025-12-07', gmv: 4700, net: 3800 },
  ],
  byZone: [
    { zone: 'Accra Central', revenue: 32000 },
    { zone: 'East Legon', revenue: 21000 },
    { zone: 'Osu', revenue: 18000 },
    { zone: 'Airport', revenue: 14000 },
    { zone: 'Tema', revenue: 10000 },
  ],
};

export const subscriptionsTrend = [
  { date: '2025-11-10', active: 380, churned: 8 },
  { date: '2025-11-20', active: 390, churned: 6 },
  { date: '2025-11-30', active: 400, churned: 5 },
  { date: '2025-12-10', active: 410, churned: 4 },
];

export const topCustomers = [
  { name: 'Kwabena Brown', phone: '0244000001', totalOrders: 32, totalSpent: 4200, avgOrder: 131.25, lastOrder: '2025-12-07' },
  { name: 'Ama Serwaa', phone: '0244000002', totalOrders: 28, totalSpent: 3900, avgOrder: 139.29, lastOrder: '2025-12-06' },
  { name: 'Yaw Mensah', phone: '0244000003', totalOrders: 25, totalSpent: 3500, avgOrder: 140.00, lastOrder: '2025-12-05' },
  { name: 'Akosua Dede', phone: '0244000004', totalOrders: 22, totalSpent: 3100, avgOrder: 140.91, lastOrder: '2025-12-04' },
];

export const failedPayments = [
  { date: '2025-12-07', customer: 'Kwabena Brown', amount: 120, method: 'Paystack', status: 'failed' },
  { date: '2025-12-06', customer: 'Ama Serwaa', amount: 85, method: 'Card', status: 'retried' },
  { date: '2025-12-05', customer: 'Yaw Mensah', amount: 60, method: 'Paystack', status: 'refunded' },
];

export const financeAlerts = [
  'Unusual drop in orders today vs last 7-day average',
  'Spike in failed Paystack payments',
];
