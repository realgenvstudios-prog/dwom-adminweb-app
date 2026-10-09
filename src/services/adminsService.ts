import type { Admin, AdminMetrics, AdminActivity, AdminAccessAlert } from './admins/adminTypes';
import { AdminDirectoryService } from './admins/adminDirectory';
import { AdminLifecycleService } from './admins/adminLifecycle';
import { AdminInsightsService } from './admins/adminInsights';

export type { Admin, AdminMetrics, AdminActivity, AdminAccessAlert };

// Composes the directory (listing/querying), lifecycle (invite/role/
// suspend), and insights (metrics/activity/alerts) pieces into the same
// flat public API this service exposed before the split — no changes
// needed at any call site. Split out of the former monolithic
// AdminsService.
class AdminsService {
  private directory = new AdminDirectoryService();
  private lifecycle = new AdminLifecycleService();
  private insights = new AdminInsightsService(() => this.directory.getAllAdmins());

  getAllAdmins(): Promise<Admin[]> {
    return this.directory.getAllAdmins();
  }

  getAdminsByRole(role: string): Promise<Admin[]> {
    return this.directory.getAdminsByRole(role);
  }

  getAdminsByStatus(status: string): Promise<Admin[]> {
    return this.directory.getAdminsByStatus(status);
  }

  searchAdmins(query: string): Promise<Admin[]> {
    return this.directory.searchAdmins(query);
  }

  inviteAdmin(data: { name: string; email: string; phone?: string; role: string }): Promise<Admin | null> {
    return this.lifecycle.inviteAdmin(data);
  }

  updateAdminRole(adminId: number, newRole: string): Promise<Admin | null> {
    return this.lifecycle.updateAdminRole(adminId, newRole);
  }

  suspendAdmin(adminId: number): Promise<boolean> {
    return this.lifecycle.suspendAdmin(adminId);
  }

  reactivateAdmin(adminId: number): Promise<boolean> {
    return this.lifecycle.reactivateAdmin(adminId);
  }

  resendInvite(inviteId: number): Promise<boolean> {
    return this.lifecycle.resendInvite(inviteId);
  }

  cancelInvite(inviteId: number): Promise<boolean> {
    return this.lifecycle.cancelInvite(inviteId);
  }

  getAdminMetrics(): Promise<AdminMetrics> {
    return this.insights.getAdminMetrics();
  }

  getAdminActivity(): Promise<AdminActivity[]> {
    return this.insights.getAdminActivity();
  }

  getAccessAlerts(): Promise<AdminAccessAlert[]> {
    return this.insights.getAccessAlerts();
  }
}

const adminsService = new AdminsService();
export default adminsService;
