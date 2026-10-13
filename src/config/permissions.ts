import { mapRole } from '../services/admins/adminRoleMapping';
import type { Admin } from '../services/admins/adminTypes';

export type UiRole = Admin['role'];

/**
 * Which roles can see which route, beyond Super Admin (who can always see
 * everything — intentionally absent from every list below, so this matrix
 * only has to express the restrictions that matter). A route with no entry
 * here is Super-Admin-only: /admins, /data-deletion-requests, and /settings
 * are deliberately left out rather than listed with an empty array, so a
 * forgotten route defaults to the most restrictive behavior instead of the
 * most permissive one.
 */
const ROUTE_ROLES: Record<string, UiRole[]> = {
  '/dashboard': ['Operations', 'Warehouse', 'Riders', 'Finance', 'Marketing', 'Support', 'Viewer'],
  '/analytics': ['Operations', 'Marketing', 'Finance'],
  '/orders': ['Operations', 'Warehouse', 'Support'],
  '/delivery-zones': ['Operations', 'Riders'],
  '/warehouse': ['Operations', 'Warehouse'],
  '/suppliers': ['Operations', 'Warehouse'],
  '/products': ['Operations', 'Warehouse', 'Marketing'],
  '/categories': ['Operations', 'Warehouse', 'Marketing'],
  '/bundles': ['Operations', 'Warehouse', 'Marketing'],
  '/seasonal': ['Operations', 'Marketing'],
  '/subscriptions': ['Operations', 'Finance'],
  '/riders': ['Operations', 'Riders'],
  '/customers': ['Support', 'Marketing'],
  '/notes': ['Operations', 'Marketing'],
  '/finance': ['Finance'],
  '/expenses': ['Finance'],
  '/workers': ['Operations', 'Finance'],
  '/marketing': ['Marketing'],
  '/coupons': ['Marketing', 'Finance'],
  '/support': ['Support'],
};

/** The route every role lands on after login / on an access-denied redirect. */
export const DEFAULT_ROUTE = '/dashboard';

export const ALL_ROLES: UiRole[] = [
  'Super Admin', 'Operations', 'Warehouse', 'Riders', 'Finance', 'Marketing', 'Support', 'Viewer',
];

/** Single source of truth for sidebar nav (Layout.tsx) and the read-only
 * role-access reference in Settings — one list so they can't drift apart. */
export const ALL_PAGES: { path: string; label: string }[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/orders', label: 'Orders' },
  { path: '/delivery-zones', label: 'Delivery Zones' },
  { path: '/warehouse', label: 'Warehouse Operations' },
  { path: '/suppliers', label: 'Suppliers & Purchases' },
  { path: '/products', label: 'Products' },
  { path: '/categories', label: 'Categories' },
  { path: '/bundles', label: 'Bundles' },
  { path: '/seasonal', label: 'Seasonal Products' },
  { path: '/subscriptions', label: 'Subscriptions' },
  { path: '/riders', label: 'Riders' },
  { path: '/customers', label: 'Customers' },
  { path: '/notes', label: 'Notes & Search Tracking' },
  { path: '/finance', label: 'Finance' },
  { path: '/expenses', label: 'Expenses' },
  { path: '/workers', label: 'Workers & Trips' },
  { path: '/marketing', label: 'Marketing' },
  { path: '/coupons', label: 'Discount Codes' },
  { path: '/admins', label: 'Admins' },
  { path: '/data-deletion-requests', label: 'Data Deletion Requests' },
  { path: '/support', label: 'Support' },
  { path: '/settings', label: 'Settings' },
  { path: '/founder-ledger', label: 'Founder Ledger' },
];

/** For each role, the page labels it can actually reach — the real thing
 * the old Settings "Permissions Matrix" mock was pretending to show. */
export function getRoleAccessMatrix(): { role: UiRole; pages: string[] }[] {
  return ALL_ROLES.map((role) => ({
    role,
    pages: ALL_PAGES.filter((p) => canAccessRoute(role, p.path)).map((p) => p.label),
  }));
}

export function resolveUiRole(admin: { role?: string; adminRole?: string } | null | undefined): UiRole {
  if (!admin) return 'Viewer';
  return mapRole(admin.adminRole || admin.role || '');
}

export function canAccessRoute(role: UiRole, path: string): boolean {
  if (role === 'Super Admin') return true;
  const allowed = ROUTE_ROLES[path];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function getAccessibleMenuPaths(role: UiRole, allPaths: string[]): string[] {
  return allPaths.filter((path) => canAccessRoute(role, path));
}
