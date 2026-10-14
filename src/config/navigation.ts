import {
  BarChart3,
  Bike,
  Headset,
  LayoutDashboard,
  Megaphone,
  Repeat,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  UserX,
  Users,
  Wallet,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { ALL_PAGES, canAccessRoute, type UiRole } from './permissions';

export interface NavSubItem {
  label: string;
  tab: string;
  href: string;
}

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  children?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// Presentation only: grouping, order, and icons for the sidebar and ⌘K menu.
// Paths and labels come from ALL_PAGES; who sees what still comes from
// canAccessRoute — this file never grants or removes access.
const GROUPS: { label: string; paths: string[] }[] = [
  { label: 'Overview', paths: ['/dashboard', '/analytics'] },
  { label: 'Sales', paths: ['/orders', '/subscriptions', '/customers', '/support'] },
  { label: 'Operations', paths: ['/catalog', '/warehouse', '/field-operations'] },
  { label: 'Business', paths: ['/marketing', '/finance'] },
  { label: 'Administration', paths: ['/admins', '/data-deletion-requests', '/settings'] },
];

const ICONS: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/analytics': BarChart3,
  '/orders': ShoppingCart,
  '/subscriptions': Repeat,
  '/customers': Users,
  '/support': Headset,
  '/catalog': Store,
  '/warehouse': Warehouse,
  '/field-operations': Bike,
  '/marketing': Megaphone,
  '/finance': Wallet,
  '/admins': ShieldCheck,
  '/data-deletion-requests': UserX,
  '/settings': Settings,
};

const SHORT_LABELS: Record<string, string> = {
  '/warehouse': 'Warehouse',
  '/data-deletion-requests': 'Data Deletion',
};

// Tabs inside a page, surfaced as expandable sub-items. `tab` must match the
// page's useTabParam keys; the first entry is the page's default tab.
// superAdminOnly mirrors a tab the page itself only renders for Super Admin.
const SUB_PAGES: Record<string, { label: string; tab: string; superAdminOnly?: boolean }[]> = {
  '/analytics': [
    { label: 'Orders', tab: 'orders' },
    { label: 'App usage', tab: 'overview' },
    { label: 'Shopping notes', tab: 'notes' },
  ],
  '/catalog': [
    { label: 'Products', tab: 'products' },
    { label: 'Categories', tab: 'categories' },
    { label: 'Bundles', tab: 'bundles' },
  ],
  '/warehouse': [
    { label: 'Inventory', tab: 'operations' },
    { label: 'Suppliers', tab: 'suppliers' },
  ],
  '/field-operations': [
    { label: 'Riders', tab: 'riders' },
    { label: 'Pickers', tab: 'pickers' },
    { label: 'Delivery Zones', tab: 'zones' },
  ],
  '/marketing': [
    { label: 'Campaigns', tab: 'campaigns' },
    { label: 'Notifications', tab: 'notifications' },
    { label: 'Discount Codes', tab: 'coupons' },
  ],
  '/finance': [
    { label: 'Overview & P&L', tab: 'overview' },
    { label: 'Product Costs', tab: 'productCosts' },
    { label: 'Expenses', tab: 'expenses' },
    { label: 'Founder Ledger', tab: 'founderLedger', superAdminOnly: true },
    { label: 'Settings', tab: 'settings' },
  ],
};

function toNavItem(page: { path: string; label: string }, role: UiRole): NavItem {
  const subs = SUB_PAGES[page.path]
    ?.filter((s) => !s.superAdminOnly || role === 'Super Admin')
    .map((s, i) => ({ label: s.label, tab: s.tab, href: i === 0 ? page.path : `${page.path}?tab=${s.tab}` }));
  return {
    path: page.path,
    label: SHORT_LABELS[page.path] ?? page.label,
    icon: ICONS[page.path] ?? LayoutDashboard,
    children: subs && subs.length > 0 ? subs : undefined,
  };
}

/** Which sub-item is active for this page, given the current ?tab= value. */
export function activeSubTab(item: NavItem, tabParam: string | null): string | undefined {
  if (!item.children) return undefined;
  return item.children.find((c) => c.tab === tabParam)?.tab ?? item.children[0].tab;
}

export function getNavGroups(role: UiRole): NavGroup[] {
  const accessible = ALL_PAGES.filter((p) => canAccessRoute(role, p.path));
  const grouped = new Set(GROUPS.flatMap((g) => g.paths));

  const groups = GROUPS.map((g) => ({
    label: g.label,
    items: g.paths
      .map((path) => accessible.find((p) => p.path === path))
      .filter((p): p is { path: string; label: string } => !!p)
      .map((p) => toNavItem(p, role)),
  })).filter((g) => g.items.length > 0);

  // A page added to ALL_PAGES but not to GROUPS still shows up rather than vanishing.
  const ungrouped = accessible.filter((p) => !grouped.has(p.path)).map((p) => toNavItem(p, role));
  if (ungrouped.length > 0) groups.push({ label: 'Other', items: ungrouped });

  return groups;
}

export function findNavItem(pathname: string, role: UiRole): { group: string; item: NavItem } | null {
  for (const g of GROUPS) {
    const path = g.paths.find((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (path) {
      const page = ALL_PAGES.find((p) => p.path === path);
      if (page) return { group: g.label, item: toNavItem(page, role) };
    }
  }
  return null;
}
