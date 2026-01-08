import adminApiClient from './apiClient';

export interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'Super Admin' | 'Operations' | 'Warehouse' | 'Riders' | 'Finance' | 'Marketing' | 'Support' | 'Viewer';
  zones: string;
  lastLogin: string;
  status: 'Active' | 'Pending' | 'Suspended';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminMetrics {
  totalAdmins: number;
  activeAdmins: number;
  pendingAdmins: number;
  suspendedAdmins: number;
  roleCounts: Record<string, number>;
}

export interface AdminActivity {
  time: string;
  text: string;
  adminId?: number;
  adminName?: string;
}

export interface AdminAccessAlert {
  id: number;
  type: 'failed_login' | 'suspended' | 'outdated_role' | 'no_activity';
  message: string;
  adminId: number;
  adminName: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}

class AdminsService {
  /**
   * Get all admins (users with admin role or specific roles)
   */
  async getAllAdmins(): Promise<Admin[]> {
    try {
      console.log('👨‍💼 [AdminsService] Fetching all admins...');
      
      // Fetch all users from backend
      const response = (await adminApiClient.get('/users')) as any;
      const users = response?.data || [];

      // Filter for admin users (role is not 'user')
      const admins = users
        .filter((user: any) => user.role && user.role !== 'user')
        .map((user: any) => ({
          id: user.id,
          name: user.name || 'Unknown',
          email: user.email || 'N/A',
          phone: user.phoneNumber || user.phone || 'N/A',
          role: this._mapRole(user.role),
          zones: user.zones || 'All',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
          status: this._determineStatus(user),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

      console.log(`✅ [AdminsService] Fetched ${admins.length} admins`);
      return admins;
    } catch (error) {
      console.error('❌ [AdminsService] Error fetching admins:', error);
      return [];
    }
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

  /**
   * Invite new admin (create admin user)
   */
  async inviteAdmin(data: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    zones?: string;
  }): Promise<Admin | null> {
    try {
      console.log('📧 [AdminsService] Inviting new admin:', data.email);

      const response = (await apiClient.post('/users', {
        name: data.name,
        email: data.email,
        phoneNumber: data.phone,
        role: this._reverseMapRole(data.role),
        zones: data.zones,
      })) as any;

      if (response?.data) {
        return {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phoneNumber || 'N/A',
          role: this._mapRole(response.data.role),
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
      console.log(`👤 [AdminsService] Updating admin ${adminId} role to ${newRole}`);

      const response = (await apiClient.patch(`/users/${adminId}`, {
        role: this._reverseMapRole(newRole),
      })) as any;

      if (response?.data) {
        return {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phoneNumber || 'N/A',
          role: this._mapRole(response.data.role),
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
      console.log(`🚫 [AdminsService] Suspending admin ${adminId}`);

      await apiClient.patch(`/users/${adminId}`, {
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
      console.log(`✅ [AdminsService] Reactivating admin ${adminId}`);

      await apiClient.patch(`/users/${adminId}`, {
        status: 'active',
      });

      return true;
    } catch (error) {
      console.error('❌ [AdminsService] Error reactivating admin:', error);
      return false;
    }
  }

  /**
   * Helper: Map backend role to UI role
   */
  private _mapRole(backendRole: string): 'Super Admin' | 'Operations' | 'Warehouse' | 'Riders' | 'Finance' | 'Marketing' | 'Support' | 'Viewer' {
    const roleMap: Record<string, any> = {
      'super_admin': 'Super Admin',
      'admin': 'Super Admin',
      'operations': 'Operations',
      'warehouse': 'Warehouse',
      'riders': 'Riders',
      'finance': 'Finance',
      'marketing': 'Marketing',
      'support': 'Support',
      'viewer': 'Viewer',
    };
    return roleMap[backendRole?.toLowerCase()] || 'Viewer';
  }

  /**
   * Helper: Map UI role to backend role
   */
  private _reverseMapRole(uiRole: string): string {
    const roleMap: Record<string, string> = {
      'Super Admin': 'super_admin',
      'Operations': 'operations',
      'Warehouse': 'warehouse',
      'Riders': 'riders',
      'Finance': 'finance',
      'Marketing': 'marketing',
      'Support': 'support',
      'Viewer': 'viewer',
    };
    return roleMap[uiRole] || 'viewer';
  }

  /**
   * Helper: Determine admin status based on last login
   */
  private _determineStatus(user: any): 'Active' | 'Pending' | 'Suspended' {
    if (user.status === 'suspended') {
      return 'Suspended';
    }

    if (!user.lastLogin) {
      return 'Pending';
    }

    // Check if last login was within 7 days
    const lastLoginDate = new Date(user.lastLogin);
    const daysSinceLogin = Math.floor(
      (Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLogin > 30 ? 'Suspended' : 'Active';
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

const adminsService = new AdminsService();
export default adminsService;
