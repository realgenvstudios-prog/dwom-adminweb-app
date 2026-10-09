import type { Admin } from './adminTypes';

/**
 * Map backend role to UI role
 */
export function mapRole(backendRole: string): Admin['role'] {
  const roleMap: Record<string, any> = {
    'super_admin': 'Super Admin',
    'admin': 'Super Admin',
    'operations': 'Operations',
    'warehouse': 'Warehouse',
    'riders': 'Riders',
    'finance': 'Finance',
    'marketing': 'Marketing',
    'support': 'Support',
    'viewer': 'Viewer',
  };
  return roleMap[backendRole?.toLowerCase()] || 'Viewer';
}

/**
 * Map UI role to backend role
 */
export function reverseMapRole(uiRole: string): string {
  const roleMap: Record<string, string> = {
    'Super Admin': 'super_admin',
    'Operations': 'operations',
    'Warehouse': 'warehouse',
    'Riders': 'riders',
    'Finance': 'finance',
    'Marketing': 'marketing',
    'Support': 'support',
    'Viewer': 'viewer',
  };
  return roleMap[uiRole] || 'viewer';
}

/**
 * Determine admin status based on last login
 */
// Was checking user.status/user.lastLogin, fields the backend never sent
// (the real columns are isActive/lastLoginAt) — every real admin showed
// as "Pending" regardless of actual state. isActive is a real, explicit
// suspend/reactivate flag now; "30 days since login = suspended" was an
// inappropriate inference and is gone, not replaced.
export function determineStatus(user: any): 'Active' | 'Pending' | 'Suspended' {
  if (user.isActive === false) {
    return 'Suspended';
  }

  if (!user.lastLoginAt) {
    return 'Pending';
  }

  return 'Active';
}
