import adminApiClient from '../apiClient';
import { reverseMapRole } from './adminRoleMapping';
import { logger } from '../../utils/logger';
import type { InviteResult, PermissionCatalog } from './adminTypes';

// Inviting, role changes, suspend/reactivate, and invite management — all
// Super Admin only server-side. Each throws ApiError with the server's
// message (e.g. "You can't suspend yourself"), so the UI can show it.
export class AdminLifecycleService {
  /** Emails an invite link; the account is created when they accept (they set their own phone/password). */
  async inviteAdmin(data: { name: string; email: string; role: string; permissions?: string[] }): Promise<InviteResult> {
    try {
      return await adminApiClient.post<InviteResult>('/users', { name: data.name, email: data.email, role: reverseMapRole(data.role), permissions: data.permissions });
    } catch (error) {
      logger.error('❌ [AdminsService] Error inviting admin:', error);
      throw error;
    }
  }

  async updateAdminRole(adminId: number, newRole: string): Promise<void> {
    try {
      await adminApiClient.patch(`/users/${adminId}`, { role: reverseMapRole(newRole) });
    } catch (error) {
      logger.error('❌ [AdminsService] Error updating admin role:', error);
      throw error;
    }
  }

  /** Takes effect on the admin's very next request (the auth guard checks isActive). */
  async setSuspended(adminId: number, suspended: boolean): Promise<void> {
    try {
      await adminApiClient.patch(`/users/${adminId}`, { status: suspended ? 'suspended' : 'active' });
    } catch (error) {
      logger.error('❌ [AdminsService] Error changing admin status:', error);
      throw error;
    }
  }

  /** Issues a fresh 7-day link (also for an expired invite) and invalidates the old one. */
  async resendInvite(inviteId: number): Promise<InviteResult> {
    return adminApiClient.post<InviteResult>(`/users/invites/${inviteId}/resend`);
  }

  /** The checkbox list, each role's defaults, and the signed-in admin's own permissions. */
  async getPermissionCatalog(): Promise<PermissionCatalog> {
    return adminApiClient.get<PermissionCatalog>('/auth/admin/permissions');
  }

  /** Saves ticked boxes for an admin; takes effect on their next action. */
  async setPermissions(adminId: number, permissions: string[]): Promise<void> {
    await adminApiClient.patch(`/users/${adminId}`, { permissions });
  }

  /** Back to their role's defaults. */
  async resetPermissions(adminId: number): Promise<void> {
    await adminApiClient.patch(`/users/${adminId}`, { useRolePreset: true });
  }

  /**
   * Removes an admin for good: their access ends immediately. If they also
   * shop on the app they stay a customer (orders kept); otherwise the account is deleted.
   */
  async removeAdmin(adminId: number): Promise<{ removed: boolean; keptAsCustomer: boolean }> {
    return adminApiClient.delete(`/users/admins/${adminId}`);
  }

  /** The link stops working immediately. */
  async cancelInvite(inviteId: number): Promise<void> {
    await adminApiClient.delete(`/users/invites/${inviteId}`);
  }

  /** Emails a one-time reset link (24h). `resetUrl` is returned only when the server can't send email. */
  async sendPasswordReset(adminId: number): Promise<{ email: string; emailed: boolean; expiresAt: string; resetUrl?: string }> {
    return adminApiClient.post(`/users/${adminId}/password-reset`);
  }

  /** Self-scoped server-side from the JWT. */
  async changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
    await adminApiClient.patch('/admin/change-password', { currentPassword, newPassword });
  }
}
