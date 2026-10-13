import type { Admin, AdminMetrics, AdminActivity, AdminAccessAlert } from './adminTypes';
import { logger } from '../../utils/logger';

// Metrics, activity feed, and access alerts derived from the admin list.
// Split out of the former monolithic AdminsService. Takes a
// getAllAdmins function rather than importing AdminDirectoryService
// itself, so the two can be composed independently by the caller.
export class AdminInsightsService {
  private getAllAdmins: () => Promise<Admin[]>;

  constructor(getAllAdmins: () => Promise<Admin[]>) {
    this.getAllAdmins = getAllAdmins;
  }

  /**
   * Get admin metrics summary
   */
  async getAdminMetrics(): Promise<AdminMetrics> {
    try {
      const admins = await this.getAllAdmins();

      const activeAdmins = admins.filter(a => a.status === 'Active').length;
      const pendingAdmins = admins.filter(a => a.status === 'Pending').length;
      const suspendedAdmins = admins.filter(a => a.status === 'Suspended').length;

      const roleCounts: Record<string, number> = {
        'Super Admin': 0,
        'Operations': 0,
        'Warehouse': 0,
        'Riders': 0,
        'Finance': 0,
        'Marketing': 0,
        'Support': 0,
        'Viewer': 0,
      };

      admins.forEach(admin => {
        if (roleCounts[admin.role] !== undefined) {
          roleCounts[admin.role]++;
        }
      });

      return {
        totalAdmins: admins.length,
        activeAdmins,
        pendingAdmins,
        suspendedAdmins,
        roleCounts,
      };
    } catch (error) {
      logger.error('❌ [AdminsService] Error fetching metrics:', error);
      return {
        totalAdmins: 0,
        activeAdmins: 0,
        pendingAdmins: 0,
        suspendedAdmins: 0,
        roleCounts: {},
      };
    }
  }

  /**
   * Admin activity feed — intentionally empty. There is no backend audit
   * log of admin actions yet (no endpoint, no table), so this used to
   * return fabricated entries with fictional admin names standing in for
   * real events. Returning [] lets AdminsPage's existing "No activity yet"
   * empty state do its job honestly until a real audit log is built.
   */
  async getAdminActivity(): Promise<AdminActivity[]> {
    return [];
  }

  /**
   * Get access alerts
   */
  async getAccessAlerts(): Promise<AdminAccessAlert[]> {
    try {
      const admins = await this.getAllAdmins();

      const alerts: AdminAccessAlert[] = [];

      // Check for suspended accounts
      admins
        .filter(a => a.status === 'Suspended')
        .forEach(admin => {
          alerts.push({
            id: Math.random(),
            type: 'suspended',
            message: `Suspended account: ${admin.name}`,
            adminId: admin.id,
            adminName: admin.name,
            severity: 'high',
            createdAt: new Date().toISOString(),
          });
        });

      // Check for pending accounts
      admins
        .filter(a => a.status === 'Pending')
        .forEach(admin => {
          alerts.push({
            id: Math.random(),
            type: 'no_activity',
            message: `No recent activity: ${admin.name}`,
            adminId: admin.id,
            adminName: admin.name,
            severity: 'medium',
            createdAt: new Date().toISOString(),
          });
        });

      // Check for Viewer role (outdated)
      admins
        .filter(a => a.role === 'Viewer')
        .forEach(admin => {
          alerts.push({
            id: Math.random(),
            type: 'outdated_role',
            message: `Outdated role: ${admin.name} (Viewer)`,
            adminId: admin.id,
            adminName: admin.name,
            severity: 'low',
            createdAt: new Date().toISOString(),
          });
        });

      return alerts;
    } catch (error) {
      logger.error('❌ [AdminsService] Error fetching alerts:', error);
      return [];
    }
  }
}
