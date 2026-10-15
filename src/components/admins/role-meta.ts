import type { AdminRole } from '../../services/adminsService';
import { getRoleAccessMatrix } from '../../config/permissions';

export const ROLE_BLURB: Record<AdminRole, string> = {
  'Super Admin': 'Everything, including admins, settings and data deletion.',
  Operations: 'Runs day-to-day: orders, stock, catalog, riders and pickers.',
  Warehouse: 'Orders, inventory and suppliers, catalog.',
  Riders: 'Riders, pickers and delivery zones.',
  Finance: 'Money: finance, subscriptions, rider and picker pay, marketing spend, analytics.',
  Marketing: 'Campaigns, codes, catalog, customers, analytics.',
  Support: 'Customer chats, orders and customers.',
  Viewer: 'Dashboard only.',
};

export const ROLE_TINT: Record<AdminRole, string> = {
  'Super Admin': 'border-violet-500/20 bg-violet-500/10 text-violet-700',
  Operations: 'border-sky-500/20 bg-sky-500/10 text-sky-700',
  Warehouse: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  Riders: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
  Finance: 'border-teal-500/20 bg-teal-500/10 text-teal-700',
  Marketing: 'border-pink-500/20 bg-pink-500/10 text-pink-700',
  Support: 'border-orange-500/20 bg-orange-500/10 text-orange-700',
  Viewer: 'text-muted-foreground',
};

/** Pages each role can open — straight from config/permissions, so it can't drift. */
export const ROLE_PAGES: Record<string, string[]> = Object.fromEntries(getRoleAccessMatrix().map((r) => [r.role, r.pages]));

export const STATUS_TINT = {
  Active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700',
  Invited: 'border-sky-500/20 bg-sky-500/10 text-sky-700',
  Expired: 'border-amber-500/20 bg-amber-500/10 text-amber-700',
  Suspended: 'border-red-500/20 bg-red-500/10 text-red-700',
} as const;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';
