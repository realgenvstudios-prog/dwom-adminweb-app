// SAMPLE DATA — not real. Shown only while the "Sample data" switch is on
// (it turns on by itself when there's no real data yet), always under a
// banner saying so. Same shapes as the real endpoints, so the page renders
// identically either way. Delete this file once real events are flowing.
import type { AnalyticsInsights } from '../../services/analyticsService';
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
