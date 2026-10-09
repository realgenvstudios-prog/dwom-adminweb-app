import adminApiClient from '../apiClient';
import type { Admin } from './adminTypes';
import { mapRole, reverseMapRole } from './adminRoleMapping';

// Inviting, role changes, suspend/reactivate, and invite management for
// admins. Split out of the former monolithic AdminsService.
export class AdminLifecycleService {
  /**
   * Invite new admin (create admin user)
   */
  async inviteAdmin(data: {
    name: string;
    email: string;
    phone?: string;
    role: string;
  }): Promise<Admin | null> {
    try {

      const response = (await adminApiClient.post('/users', {
        name: data.name,
        email: data.email,
        phoneNumber: data.phone,
        role: reverseMapRole(data.role),
      })) as any;

      if (response?.data) {
        return {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phoneNumber || 'N/A',
          role: mapRole(response.data.role),
          zones: response.data.zones || 'All',
          lastLogin: 'Never',
          status: 'Pending',
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [AdminsService] Error inviting admin:', error);
      throw error;
    }
  }

  /**
   * Update admin role
   */
  async updateAdminRole(adminId: number, newRole: string): Promise<Admin | null> {
    try {

      const response = (await adminApiClient.patch(`/users/${adminId}`, {
        role: reverseMapRole(newRole),
      })) as any;

      if (response?.data) {
        return {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phoneNumber || 'N/A',
          role: mapRole(response.data.role),
          zones: response.data.zones || 'All',
          lastLogin: response.data.lastLogin || 'Never',
          status: 'Active',
        };
      }

      return null;
    } catch (error) {
      console.error('❌ [AdminsService] Error updating admin role:', error);
      throw error;
    }
  }

  /**
   * Suspend admin (set status to suspended)
   */
  async suspendAdmin(adminId: number): Promise<boolean> {
    try {

      await adminApiClient.patch(`/users/${adminId}`, {
        status: 'suspended',
      });

      return true;
    } catch (error) {
      console.error('❌ [AdminsService] Error suspending admin:', error);
      return false;
    }
  }

  /**
   * Reactivate suspended admin
   */
  async reactivateAdmin(adminId: number): Promise<boolean> {
    try {

      await adminApiClient.patch(`/users/${adminId}`, {
        status: 'active',
      });

      return true;
    } catch (error) {
      console.error('❌ [AdminsService] Error reactivating admin:', error);
      return false;
    }
  }

  /**
   * Resend a pending invite — issues a fresh link, invalidating the old one
   */
  async resendInvite(inviteId: number): Promise<boolean> {
    try {
      await adminApiClient.post(`/users/invites/${inviteId}/resend`);
      return true;
    } catch (error) {
      console.error('❌ [AdminsService] Error resending invite:', error);
      return false;
    }
  }

  /**
   * Cancel a pending invite — the link stops working immediately
   */
  async cancelInvite(inviteId: number): Promise<boolean> {
    try {
      await adminApiClient.delete(`/users/invites/${inviteId}`);
      return true;
    } catch (error) {
      console.error('❌ [AdminsService] Error cancelling invite:', error);
      return false;
    }
  }
}
