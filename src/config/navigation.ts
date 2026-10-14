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

export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
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

function toNavItem(page: { path: string; label: string }): NavItem {
  return {
    path: page.path,
    label: SHORT_LABELS[page.path] ?? page.label,
    icon: ICONS[page.path] ?? LayoutDashboard,
  };
}

export function getNavGroups(role: UiRole): NavGroup[] {
  const accessible = ALL_PAGES.filter((p) => canAccessRoute(role, p.path));
  const grouped = new Set(GROUPS.flatMap((g) => g.paths));

  const groups = GROUPS.map((g) => ({
    label: g.label,
    items: g.paths
      .map((path) => accessible.find((p) => p.path === path))
      .filter((p): p is { path: string; label: string } => !!p)
      .map(toNavItem),
  })).filter((g) => g.items.length > 0);

  // A page added to ALL_PAGES but not to GROUPS still shows up rather than vanishing.
  const ungrouped = accessible.filter((p) => !grouped.has(p.path)).map(toNavItem);
  if (ungrouped.length > 0) groups.push({ label: 'Other', items: ungrouped });

  return groups;
}

export function findNavItem(pathname: string): { group: string; item: NavItem } | null {
  for (const g of GROUPS) {
    const path = g.paths.find((p) => pathname === p || pathname.startsWith(`${p}/`));
    if (path) {
      const page = ALL_PAGES.find((p) => p.path === path);
      if (page) return { group: g.label, item: toNavItem(page) };
    }
  }
  return null;
}
