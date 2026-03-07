import adminApiClient from './apiClient';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'finance' | 'warehouse' | 'support';
  lastActive?: string;
  createdAt?: string;
}

export interface CreateAdminUserDto {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'finance' | 'warehouse' | 'support';
}

export interface UpdateAdminUserDto {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'finance' | 'warehouse' | 'support';
}

export type AuditLog = {
  id: number;
  adminId: number;
  adminName: string;
  action: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
}

export const adminUsersService = {
  /**
   * Get all admin users
   */
  async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      const users = await adminApiClient.get<AdminUser[]>('/admin/users');
      return users;
    } catch (error: any) {
      console.error('❌ [AdminUsersService] Failed to fetch admin users:', error);
      throw error;
    }
  },

  /**
   * Get admin user by ID
   */
  async getAdminUserById(id: number): Promise<AdminUser> {
    try {
      const user = await adminApiClient.get<AdminUser>(`/admin/users/${id}`);
      return user;
    } catch (error: any) {
      console.error(`❌ [AdminUsersService] Failed to fetch admin user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new admin user
   */
  async createAdminUser(dto: CreateAdminUserDto): Promise<AdminUser> {
    try {
      const user = await adminApiClient.post<AdminUser>('/admin/users', dto);
      return user;
    } catch (error: any) {
      console.error('❌ [AdminUsersService] Failed to create admin user:', error);
      throw error;
    }
  },

  /**
   * Update admin user
   */
  async updateAdminUser(id: number, dto: UpdateAdminUserDto): Promise<AdminUser> {
    try {
      const user = await adminApiClient.patch<AdminUser>(`/admin/users/${id}`, dto);
      return user;
    } catch (error: any) {
      console.error(`❌ [AdminUsersService] Failed to update admin user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete admin user
   */
  async deleteAdminUser(id: number): Promise<void> {
    try {
      await adminApiClient.delete(`/admin/users/${id}`);
    } catch (error: any) {
      console.error(`❌ [AdminUsersService] Failed to delete admin user ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(limit?: number): Promise<AuditLog[]> {
    try {
      const logs = await adminApiClient.get<AuditLog[]>(`/admin/audit-logs${limit ? `?limit=${limit}` : ''}`);
      return logs;
    } catch (error: any) {
      console.error('❌ [AdminUsersService] Failed to fetch audit logs:', error);
      throw error;
    }
  },

  /**
   * Change admin user password
   */
  async changePassword(id: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      await adminApiClient.post(`/admin/users/${id}/change-password`, {
        currentPassword,
        newPassword,
      });
    } catch (error: any) {
      console.error(`❌ [AdminUsersService] Failed to change password for user ${id}:`, error);
      throw error;
    }
  },
};

export default adminUsersService;
