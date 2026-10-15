import type { AdminRole } from './adminTypes';

/**
 * Map backend role to UI role
 */
export function mapRole(backendRole: string): AdminRole {
  const roleMap: Record<string, AdminRole> = {
    super_admin: 'Super Admin',
    admin: 'Super Admin',
    operations: 'Operations',
    warehouse: 'Warehouse',
    riders: 'Riders',
    finance: 'Finance',
    marketing: 'Marketing',
    support: 'Support',
    viewer: 'Viewer',
  };
  return roleMap[backendRole?.toLowerCase()] || 'Viewer';
}

/**
 * Map UI role to backend role
 */
export function reverseMapRole(uiRole: string): string {
  const roleMap: Record<string, string> = {
    'Super Admin': 'super_admin',
    Operations: 'operations',
    Warehouse: 'warehouse',
    Riders: 'riders',
    Finance: 'finance',
    Marketing: 'marketing',
    Support: 'support',
    Viewer: 'viewer',
  };
  return roleMap[uiRole] || 'viewer';
}
