import type { Admin, AdminMetrics, AdminRole } from './admins/adminTypes';
import { AdminDirectoryService } from './admins/adminDirectory';
import { AdminLifecycleService } from './admins/adminLifecycle';
import { AdminInsightsService } from './admins/adminInsights';

export type { Admin, AdminMetrics, AdminRole };

// Admin accounts and invites. The old fabricated activity feed and
// "access alerts" (e.g. every Viewer flagged as an "outdated role") are
// gone — there's no admin audit log behind them.
class AdminsService {
  private directory = new AdminDirectoryService();
  private lifecycle = new AdminLifecycleService();
  private insights = new AdminInsightsService(() => this.directory.getAllAdmins());

  getAllAdmins(): Promise<Admin[]> {
    return this.directory.getAllAdmins();
  }

  inviteAdmin(data: { name: string; email: string; role: string }): Promise<void> {
    return this.lifecycle.inviteAdmin(data);
  }

  updateAdminRole(adminId: number, newRole: string): Promise<void> {
    return this.lifecycle.updateAdminRole(adminId, newRole);
  }

  setSuspended(adminId: number, suspended: boolean): Promise<void> {
    return this.lifecycle.setSuspended(adminId, suspended);
  }

  resendInvite(inviteId: number): Promise<void> {
    return this.lifecycle.resendInvite(inviteId);
  }

  cancelInvite(inviteId: number): Promise<void> {
    return this.lifecycle.cancelInvite(inviteId);
  }

  sendPasswordReset(adminId: number) {
    return this.lifecycle.sendPasswordReset(adminId);
  }

  changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.lifecycle.changeOwnPassword(currentPassword, newPassword);
  }

  getAdminMetrics(): Promise<AdminMetrics> {
    return this.insights.getAdminMetrics();
  }
}

const adminsService = new AdminsService();
export default adminsService;
