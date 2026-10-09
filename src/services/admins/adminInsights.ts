import type { Admin, AdminMetrics, AdminActivity, AdminAccessAlert } from './adminTypes';

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
      console.error('❌ [AdminsService] Error fetching metrics:', error);
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
   * Get admin activity (mock for now - would need backend logging)
   */
  async getAdminActivity(): Promise<AdminActivity[]> {
    try {
      // This would ideally come from an audit log in the backend
      // For now, returning mock data
      return [
        {
          time: 'Today 14:21',
          text: 'Admin updated warehouse zones',
          adminId: 1,
          adminName: 'Ama Serwaa',
        },
        {
          time: 'Today 09:04',
          text: 'New admin invited',
          adminId: 2,
          adminName: 'Yaw Mensah',
        },
        {
          time: 'Yesterday 19:33',
          text: 'Failed login attempt',
          adminId: 4,
          adminName: 'Akosua Dede',
        },
        {
          time: 'Yesterday 17:20',
          text: 'Admin permissions updated',
          adminId: 5,
          adminName: 'Kwabena Brown',
        },
      ];
    } catch (error) {
      console.error('❌ [AdminsService] Error fetching activity:', error);
      return [];
    }
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
      console.error('❌ [AdminsService] Error fetching alerts:', error);
      return [];
    }
  }
}
