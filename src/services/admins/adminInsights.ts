import type { Admin, AdminMetrics } from './adminTypes';
import { ALL_ROLES } from '../../config/permissions';

export class AdminInsightsService {
  private getAllAdmins: () => Promise<Admin[]>;

  constructor(getAllAdmins: () => Promise<Admin[]>) {
    this.getAllAdmins = getAllAdmins;
  }

  async getAdminMetrics(): Promise<AdminMetrics> {
    const admins = await this.getAllAdmins();
    const roleCounts: Record<string, number> = Object.fromEntries(ALL_ROLES.map((r) => [r, 0]));
    admins.filter((a) => a.kind === 'admin').forEach((a) => (roleCounts[a.role] = (roleCounts[a.role] ?? 0) + 1));
    return {
      totalAdmins: admins.filter((a) => a.kind === 'admin').length,
      activeAdmins: admins.filter((a) => a.status === 'Active').length,
      pendingAdmins: admins.filter((a) => a.status === 'Invited' || a.status === 'Expired').length,
      suspendedAdmins: admins.filter((a) => a.status === 'Suspended').length,
      roleCounts,
    };
  }
}
