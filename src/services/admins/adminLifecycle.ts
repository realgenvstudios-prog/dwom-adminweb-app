import adminApiClient from '../apiClient';
import { reverseMapRole } from './adminRoleMapping';
import { logger } from '../../utils/logger';

// Inviting, role changes, suspend/reactivate, and invite management — all
// Super Admin only server-side. Each throws ApiError with the server's
// message (e.g. "You can't suspend yourself"), so the UI can show it.
export class AdminLifecycleService {
  /** Emails an invite link; the account is created when they accept (they set their own phone/password). */
  async inviteAdmin(data: { name: string; email: string; role: string }): Promise<void> {
    try {
      await adminApiClient.post('/users', { name: data.name, email: data.email, role: reverseMapRole(data.role) });
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

  /** Issues a fresh link and invalidates the old one. */
  async resendInvite(inviteId: number): Promise<void> {
    await adminApiClient.post(`/users/invites/${inviteId}/resend`);
  }

  /** The link stops working immediately. */
  async cancelInvite(inviteId: number): Promise<void> {
    await adminApiClient.delete(`/users/invites/${inviteId}`);
  }

  /** Self-scoped server-side from the JWT. */
  async changeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
    await adminApiClient.patch('/admin/change-password', { currentPassword, newPassword });
  }
}
