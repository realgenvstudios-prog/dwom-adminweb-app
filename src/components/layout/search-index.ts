import apiClient from '../../services/apiClient';
import ordersService from '../../services/ordersService';
import { productsService } from '../../services/productsService';
import { logger } from '../../utils/logger';
import { toOrder, type ListOrder } from '../orders/useOrders';

export interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  /** Lower-cased text the query is matched against. */
  haystack: string;
  href: string;
}

export interface SearchIndex {
  orders: SearchHit[];
  customers: SearchHit[];
  products: SearchHit[];
}

const TTL_MS = 2 * 60_000;
let cache: { at: number; key: string; index: Promise<SearchIndex> } | null = null;

const digits = (s: string) => s.replace(/\D/g, '');
const ghs = (n: number) => `GH₵ ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function safe<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (err) {
    logger.error(`❌ [Search] Couldn't load ${label}:`, err);
    return [];
  }
}

/** Loads (and briefly caches) what the ⌘K menu can search. Only sources the admin can open are fetched. */
export function loadSearchIndex(allowed: { orders: boolean; customers: boolean; products: boolean }): Promise<SearchIndex> {
  const key = `${+allowed.orders}${+allowed.customers}${+allowed.products}`;
  if (cache && cache.key === key && Date.now() - cache.at < TTL_MS) return cache.index;

  const index = Promise.all([
    allowed.orders
      ? safe('orders', async () =>
          ((await ordersService.getLatest(500)) as ListOrder[]).map(toOrder).map((o) => ({
            id: o.id,
            title: `Order #${o.id}`,
            subtitle: `${o.customer} · ${ghs(o.total)} · ${new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
            haystack: `#${o.id} ${o.id} ${o.customer} ${o.phone} ${digits(o.phone)}`.toLowerCase(),
            href: `/orders?order=${o.id}`,
          })),
        )
      : [],
    allowed.customers
      ? safe('customers', async () => {
          const rows = await apiClient.get<Array<{ id: number; name?: string; phone?: string; phoneNumber?: string; email?: string }>>('/users/admin/customers');
          return (Array.isArray(rows) ? rows : []).map((u) => {
            const phone = u.phone || u.phoneNumber || '';
            return {
              id: String(u.id),
              title: u.name || 'Unnamed customer',
              subtitle: [phone, u.email].filter(Boolean).join(' · ') || `Customer #${u.id}`,
              haystack: `${u.name ?? ''} ${phone} ${digits(phone)} ${u.email ?? ''}`.toLowerCase(),
              href: `/customers?customer=${u.id}`,
            };
          });
        })
      : [],
    allowed.products
      ? safe('products', async () =>
          (await productsService.getAll()).map((p) => ({
            id: String(p.id),
            title: p.nameEnglish,
            subtitle: [p.nameLocal, p.unitType && `per ${p.unitType}`].filter(Boolean).join(' · '),
            haystack: `${p.nameEnglish} ${p.nameLocal ?? ''} ${p.nameFrench ?? ''}`.toLowerCase(),
            href: `/catalog?product=${p.id}`,
          })),
        )
      : [],
  ]).then(([orders, customers, products]) => ({ orders, customers, products }));

  cache = { at: Date.now(), key, index };
  return index;
}

/** Best matches first: exact order number, then prefix, then anywhere. */
export function matchHits(hits: SearchHit[], query: string, limit = 5): SearchHit[] {
  const q = query.trim().toLowerCase().replace(/^#/, '');
  if (q.length < 2 && !/^\d$/.test(q)) return [];
  const qDigits = digits(q);
  const scored: { hit: SearchHit; score: number }[] = [];
  for (const hit of hits) {
    let score = -1;
    if (hit.id === q) score = 3;
    else if (hit.title.toLowerCase().startsWith(q)) score = 2;
    else if (hit.haystack.includes(q)) score = 1;
    else if (qDigits.length >= 4 && hit.haystack.includes(qDigits)) score = 1;
    if (score >= 0) scored.push({ hit, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.hit);
}
