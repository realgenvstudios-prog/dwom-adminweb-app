import adminApiClient from '../apiClient';
import type { Admin } from './adminTypes';
import { mapRole, determineStatus } from './adminRoleMapping';

// Listing/querying admins. Split out of the former monolithic
// AdminsService.
export class AdminDirectoryService {
  /**
   * Get all admins (users with admin role or specific roles)
   */
  async getAllAdmins(): Promise<Admin[]> {
    try {
      // Fetch real admin accounts and still-pending invites in parallel —
      // an invite has no User row until it's accepted, so it's invisible
      // to /users and would otherwise just vanish from this list the
      // moment it's sent.
      const [usersResponse, pendingInvites] = await Promise.all([
        adminApiClient.get('/users') as Promise<any>,
        adminApiClient.get('/users/invites/pending').catch(() => []) as Promise<any[]>,
      ]);
      const users = usersResponse?.data || [];

      // Filter for admin users (role is not 'user')
      const admins = users
        .filter((user: any) => user.role && user.role !== 'user')
        .map((user: any) => ({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || 'N/A',
          phone: user.phoneNumber || user.phone || 'N/A',
          // adminRole is the fine-grained tier (operations/finance/...);
          // role is just the coarse 'admin' flag and would make every
          // admin show as "Super Admin" regardless of their real tier.
          role: mapRole(user.adminRole || user.role),
          zones: user.zones || 'All',
          lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
          status: determineStatus(user),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

      const invitedAdmins = (pendingInvites || []).map((invite: any) => ({
        id: invite.id,
        name: invite.name || 'Unknown',
        email: invite.email || 'N/A',
        phone: 'N/A',
        role: mapRole(invite.adminRole),
        zones: 'All',
        lastLogin: 'Never',
        status: 'Pending' as const,
        createdAt: invite.createdAt,
      }));

      return [...admins, ...invitedAdmins];
    } catch (error) {
      console.error('❌ [AdminsService] Error fetching admins:', error);
      return [];
    }
  }

  /**
   * Get admins by role
   */
  async getAdminsByRole(role: string): Promise<Admin[]> {
    try {
      const allAdmins = await this.getAllAdmins();
      if (role === 'All') {
        return allAdmins;
      }
      return allAdmins.filter(a => a.role === role);
    } catch (error) {
      console.error(`❌ [AdminsService] Error fetching admins by role ${role}:`, error);
      return [];
    }
  }

  /**
   * Get admins by status
   */
  async getAdminsByStatus(status: string): Promise<Admin[]> {
    try {
      const allAdmins = await this.getAllAdmins();
      if (status === 'All') {
        return allAdmins;
      }
      return allAdmins.filter(a => a.status === status);
    } catch (error) {
      console.error(`❌ [AdminsService] Error fetching admins by status ${status}:`, error);
      return [];
    }
  }

  /**
   * Search admins
   */
  async searchAdmins(query: string): Promise<Admin[]> {
    try {
      const allAdmins = await this.getAllAdmins();
      const lowerQuery = query.toLowerCase();

      return allAdmins.filter(a =>
        a.name.toLowerCase().includes(lowerQuery) ||
        a.email.toLowerCase().includes(lowerQuery) ||
        a.phone.includes(query) ||
        a.id.toString() === query
      );
    } catch (error) {
      console.error('❌ [AdminsService] Error searching admins:', error);
      return [];
    }
  }
}
