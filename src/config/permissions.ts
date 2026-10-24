import { mapRole } from '../services/admins/adminRoleMapping';
import type { AdminRole } from '../services/admins/adminTypes';
import adminAuthService from '../services/authService';

export type UiRole = AdminRole;

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
  '/warehouse': ['Operations', 'Warehouse'],
  '/catalog': ['Operations', 'Warehouse', 'Marketing'],
  '/subscriptions': ['Operations', 'Finance'],
  '/field-operations': ['Operations', 'Riders', 'Finance'],
  '/customers': ['Support', 'Marketing'],
  '/finance': ['Finance'],
  '/marketing': ['Marketing', 'Finance'],
  '/social': ['Marketing'],
  '/support': ['Support'],
};

/** The route every role lands on after login / on an access-denied redirect. */
export const DEFAULT_ROUTE = '/dashboard';

export const ALL_ROLES: UiRole[] = ['Super Admin', 'Operations', 'Warehouse', 'Riders', 'Finance', 'Marketing', 'Support', 'Viewer'];

/** Single source of truth for sidebar nav (Layout.tsx) and the read-only
 * role-access reference in Settings — one list so they can't drift apart. */
export const ALL_PAGES: { path: string; label: string }[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/orders', label: 'Orders' },
  { path: '/warehouse', label: 'Warehouse Operations' },
  { path: '/catalog', label: 'Catalog' },
  { path: '/subscriptions', label: 'Subscriptions' },
  { path: '/field-operations', label: 'Field Operations' },
  { path: '/customers', label: 'Customers' },
  { path: '/finance', label: 'Finance' },
  { path: '/marketing', label: 'Marketing' },
  { path: '/social', label: 'Social Media' },
  { path: '/admins', label: 'Admins' },
  { path: '/data-deletion-requests', label: 'Data Deletion Requests' },
  { path: '/support', label: 'Support' },
  { path: '/settings', label: 'Settings' },
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

// Which permission keys belong to each page (keys are "<area>.<action>",
// defined on the server in src/auth/permissions.ts). A page shows when the
// admin has any of its boxes ticked. Pages not listed are Super-Admin-only.
const PAGE_PREFIXES: Record<string, string[]> = {
  '/dashboard': ['dashboard.'],
  '/analytics': ['analytics.'],
  '/orders': ['orders.'],
  '/warehouse': ['warehouse.', 'suppliers.', 'purchases.'],
  '/catalog': ['products.', 'categories.', 'bundles.'],
  '/subscriptions': ['subscriptions.'],
  '/field-operations': ['riders.', 'pickers.', 'zones.'],
  '/customers': ['customers.'],
  '/finance': ['finance.', 'expenses.'],
  '/marketing': ['campaigns.', 'notifications.', 'customerGroups.', 'coupons.'],
  '/social': ['social.'],
  '/support': ['support.'],
};

/** The signed-in admin's ticked permissions; null for a session from before they existed. */
function myPermissions(): string[] | null {
  const admin = adminAuthService.getCurrentAdmin() as { permissions?: unknown } | null;
  return Array.isArray(admin?.permissions) ? (admin.permissions as string[]) : null;
}

function pageOfKey(key: string): string | undefined {
  return Object.keys(PAGE_PREFIXES).find((path) => PAGE_PREFIXES[path].some((p) => key.startsWith(p)));
}

/**
 * Whether the signed-in admin may take an action, e.g. can('orders.assignRider').
 * The server enforces the same boxes; this only decides what to show.
 */
export function can(key: string): boolean {
  const role = resolveUiRole(adminAuthService.getCurrentAdmin());
  if (role === 'Super Admin') return true;
  const mine = myPermissions();
  if (mine) return mine.includes(key);
  // Older session: fall back to the role's page access.
  const page = pageOfKey(key);
  return !!page && (ROUTE_ROLES[page] ?? []).includes(role);
}

export function canAccessRoute(role: UiRole, path: string): boolean {
  if (role === 'Super Admin') return true;
  const prefixes = PAGE_PREFIXES[path];
  if (!prefixes) return false;
  const mine = myPermissions();
  if (mine) return mine.some((k) => prefixes.some((p) => k.startsWith(p)));
  const allowed = ROUTE_ROLES[path];
  return !!allowed && allowed.includes(role);
}

/** Where to send an admin after login or when a page is off-limits: the first page they can open. */
export function landingRoute(role: UiRole): string {
  return ALL_PAGES.find((p) => canAccessRoute(role, p.path))?.path ?? DEFAULT_ROUTE;
}

// Re-render on permission changes (they're re-read from the server when the
// dashboard opens and when the tab regains focus).
const listeners = new Set<() => void>();
let version = 0;
export function permissionsChanged() {
  version += 1;
  listeners.forEach((l) => l());
}
export function subscribePermissions(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const permissionsVersion = () => version;

export function getAccessibleMenuPaths(role: UiRole, allPaths: string[]): string[] {
  return allPaths.filter((path) => canAccessRoute(role, path));
}

// Which boxes open each tab of a multi-tab page. Entries ending in "." are
// prefixes ("riders." = any riders box). An empty list = Super Admin only.
const TAB_ACCESS: Record<string, Record<string, string[]>> = {
  '/catalog': { products: ['products.'], categories: ['categories.', 'products.view'], bundles: ['bundles.', 'products.view'] },
  '/warehouse': { operations: ['warehouse.'], suppliers: ['suppliers.', 'purchases.record'] },
  '/field-operations': { riders: ['riders.'], pickers: ['pickers.'], zones: ['zones.'] },
  '/marketing': { campaigns: ['campaigns.'], notifications: ['notifications.', 'customerGroups.manage'], coupons: ['coupons.'] },
  '/finance': { overview: ['finance.view'], productCosts: ['finance.productCosts'], expenses: ['expenses.'], founderLedger: [], settings: ['finance.settings'] },
};

/** Whether a tab of a multi-tab page is open to the signed-in admin. */
export function canTab(path: string, tab: string): boolean {
  const role = resolveUiRole(adminAuthService.getCurrentAdmin());
  if (role === 'Super Admin') return true;
  const spec = TAB_ACCESS[path]?.[tab];
  if (!spec) return canAccessRoute(role, path);
  if (spec.length === 0) return false;
  const mine = myPermissions();
  if (!mine) return canAccessRoute(role, path); // older session: page-level access
  return spec.some((k) => (k.endsWith('.') ? mine.some((m) => m.startsWith(k)) : mine.includes(k)));
}

/** The tabs of a page the admin may open, in order. */
export function allowedTabs<T extends string>(path: string, tabs: readonly T[]): T[] {
  return tabs.filter((t) => canTab(path, t));
}
