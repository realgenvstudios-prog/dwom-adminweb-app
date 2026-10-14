// SAMPLE DATA — not real. Shown only while the "Sample data" switch is on
// (it turns on by itself when there's no real data yet), always under a
// banner saying so. Same shapes as the real endpoints, so the page renders
// identically either way. Delete this file once real events are flowing.
import type { AnalyticsInsights, OrderInsights } from '../../services/analyticsService';
import type { NotesAnalytics } from '../../services/notesService';

// Deterministic, so the sample doesn't jump around between renders.
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function sampleInsights(days: number): AnalyticsInsights {
  const rand = rng(days * 97);
  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(from.getTime() + (i + 1) * 86400000);
    const weekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;
    const trend = 1 + i / (days * 3);
    const sessions = Math.round((weekend ? 210 : 150) * trend * (0.85 + rand() * 0.3));
    return { date: d.toISOString().slice(0, 10), sessions, orders: Math.round(sessions * (0.07 + rand() * 0.03)) };
  });
  const sessions = daily.reduce((t, d) => t + d.sessions, 0);
  const orders = daily.reduce((t, d) => t + d.orders, 0);
  const searched = Math.round(sessions * 0.58);
  const carted = Math.round(sessions * 0.31);
  const checkout = Math.round(sessions * 0.14);
  const scale = days / 30;
  const q = (query: string, count: number, zeroResults = 0) => ({ query, count: Math.max(1, Math.round(count * scale)), zeroResults: Math.round(zeroResults * scale) });

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      events: sessions * 14,
      sessions,
      activeCustomers: Math.round(sessions * 0.34),
      guestSessions: Math.round(sessions * 0.22),
      orders,
      paymentsSucceeded: Math.round(orders * 0.62),
      paymentsFailed: Math.round(orders * 0.05),
      searches: Math.round(searched * 2.4),
    },
    funnel: [
      { step: 'app_opened', label: 'Used the app', sessions },
      { step: 'search_performed', label: 'Searched', sessions: searched },
      { step: 'cart_item_added', label: 'Added to cart', sessions: carted },
      { step: 'checkout_started', label: 'Started checkout', sessions: checkout },
      { step: 'order_placed', label: 'Placed an order', sessions: orders },
    ],
    daily,
    topSearches: [
      q('tomatoes', 412, 0),
      q('onions', 356),
      q('rice', 301),
      q('kontomire', 214, 38),
      q('garden eggs', 198),
      q('plantain', 187),
      q('shito', 143, 21),
      q('eggs', 139),
      q('palm oil', 121),
      q('gari', 117, 9),
      q('pepper', 104),
      q('fresh fish', 88, 52),
    ],
    missedSearches: [q('fresh fish', 88, 52), q('kontomire', 214, 38), q('tilapia', 47, 47), q('shito', 143, 21), q('waakye leaves', 19, 19), q('gari', 117, 9)],
    topScreens: [
      { screen: 'Home', views: Math.round(sessions * 1.9) },
      { screen: 'Search', views: Math.round(sessions * 1.1) },
      { screen: 'Categories', views: Math.round(sessions * 0.9) },
      { screen: 'Cart', views: Math.round(sessions * 0.7) },
      { screen: 'Discounts', views: Math.round(sessions * 0.35) },
      { screen: 'Notes', views: Math.round(sessions * 0.24) },
      { screen: 'Checkout', views: Math.round(sessions * 0.2) },
      { screen: 'TrackOrder', views: Math.round(sessions * 0.12) },
    ],
    platforms: [
      { platform: 'android', sessions: Math.round(sessions * 0.81) },
      { platform: 'ios', sessions: Math.round(sessions * 0.19) },
    ],
  };
}

export const SAMPLE_NOTES: NotesAnalytics = {
  stats: { totalNotes: 1284, processedNotes: 702, errorNotes: 61, addedToCart: 431, avgConfidence: 0.83 },
  commonSearches: [
    { text: '2 tins tomatoes, onions, 1 bag rice', count: 64 },
    { text: 'kontomire and garden eggs for stew', count: 41 },
    { text: 'plantain x4', count: 37 },
    { text: 'palm oil 1L', count: 29 },
    { text: 'eggs crate', count: 26 },
  ],
  commonProducts: [],
  errorNotes: [
    { id: 1, originalText: 'the usual for sunday', notes: 'No products recognised', confidence: 0, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 2, originalText: 'abenkwan ingredients', notes: 'No products recognised', confidence: 0.1, createdAt: new Date(Date.now() - 26 * 3600000).toISOString() },
    { id: 3, originalText: 'smthn for breakfast', notes: 'No products recognised', confidence: 0.05, createdAt: new Date(Date.now() - 50 * 3600000).toISOString() },
  ],
  lowConfidenceMatches: [
    { originalText: 'tomatos', searchedAs: '3 tomatos and pepper', matchedProduct: 'Fresh Tomatoes', confidence: 0.62, matchRatio: 0.71 },
    { originalText: 'kobi', searchedAs: 'kobi for kontomire stew', matchedProduct: 'Kontomire', confidence: 0.41, matchRatio: 0.38 },
    { originalText: 'agushi', searchedAs: 'agushi 1 cup', matchedProduct: 'Egusi Seeds', confidence: 0.55, matchRatio: 0.6 },
  ],
};

export function sampleOrderInsights(days: number): OrderInsights {
  const rand = rng(days * 131);
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayWeight = [1.3, 0.7, 0.8, 0.9, 0.9, 1.4, 1.6];
  const hourWeight = Array.from({ length: 24 }, (_, h) => (h < 6 ? 0.05 : h < 9 ? 0.4 : h < 12 ? 0.9 : h < 15 ? 1.3 : h < 17 ? 0.8 : h < 21 ? 1.5 : 0.4));
  const perDay = 9;
  const heatmap = DAYS.map((_, d) => hourWeight.map((w) => Math.round(((perDay * days) / 7) * dayWeight[d] * (w / 18) * (0.7 + rand() * 0.6))));
  const byWeekday = DAYS.map((day, d) => {
    const orders = heatmap[d].reduce((t, v) => t + v, 0);
    const avgBasket = Math.round((d === 6 || d === 0 ? 96 : 74) * (0.9 + rand() * 0.2) * 100) / 100;
    return { day, orders, revenue: Math.round(orders * (avgBasket + 18)), avgBasket };
  });
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: heatmap.reduce((t, row) => t + row[h], 0) }));
  const customerPlaced = byWeekday.reduce((t, w) => t + w.orders, 0);
  const subscriptionOrders = Math.round(customerPlaced * 0.06);
  const orders = customerPlaced + subscriptionOrders;
  const cancelled = Math.round(orders * 0.04);
  const revenue = byWeekday.reduce((t, w) => t + w.revenue, 0);
  const avgBasket = Math.round((revenue / Math.max(1, customerPlaced) - 18) * 100) / 100;
  const share = [0.22, 0.38, 0.27, 0.11, 0.02];
  return {
    from: new Date(Date.now() - days * 86400000).toISOString(),
    to: new Date().toISOString(),
    totals: {
      orders,
      customerPlaced,
      subscriptionOrders,
      cancelled,
      cancellationRate: Math.round((cancelled / (orders + cancelled)) * 1000) / 10,
      revenue,
      avgOrderValue: Math.round((revenue / Math.max(1, orders)) * 100) / 100,
      avgBasket,
      medianBasket: Math.round(avgBasket * 0.82),
      avgItems: 5.4,
      ordersPerDay: Math.round((orders / days) * 10) / 10,
      customers: Math.round(orders * 0.45),
      newCustomers: Math.round(orders * 0.12),
      newOrders: Math.round(orders * 0.14),
      returningOrders: Math.round(orders * 0.86),
    },
    byWeekday,
    byHour,
    heatmap,
    basketBuckets: ['Under ₵50', '₵50–100', '₵100–200', '₵200–500', '₵500+'].map((label, i) => ({ label, orders: Math.round(orders * share[i]) })),
    topProducts: [
      ['Fresh tomatoes', 410, 1890],
      ['Eggs (half crate)', 160, 1720],
      ['Onions', 380, 1140],
      ['Plantain', 300, 1050],
      ['Rice 5kg', 70, 980],
      ['Palm oil 1L', 120, 840],
    ].map(([name, quantity, revenue]) => ({ name: String(name), quantity: Math.round(Number(quantity) * (days / 30)), revenue: Math.round(Number(revenue) * (days / 30)), orders: Math.round(Number(quantity) * 0.6 * (days / 30)) })),
    paymentMethods: [
      { method: 'cash', orders: Math.round(orders * 0.55), revenue: Math.round(revenue * 0.52) },
      { method: 'momo', orders: Math.round(orders * 0.3), revenue: Math.round(revenue * 0.31) },
      { method: 'card', orders: Math.round(orders * 0.15), revenue: Math.round(revenue * 0.17) },
    ],
  };
}
