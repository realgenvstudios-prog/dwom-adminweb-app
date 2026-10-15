import adminApiClient from '../apiClient';
import type { Admin } from './adminTypes';
import { mapRole } from './adminRoleMapping';

interface RawUser {
  permissions?: string[];
  customPermissions?: boolean;
  id: number;
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  phone?: string | null;
  role?: string;
  adminRole?: string | null;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

interface RawInvite {
  permissions?: string[];
  customPermissions?: boolean;
  id: string | number; // "invite-5"
  name?: string;
  email?: string;
  adminRole?: string;
  createdAt?: string;
  expiresAt?: string;
  status?: 'pending' | 'expired';
}

export class AdminDirectoryService {
  /** Admin accounts plus still-pending invites (an invite has no account until accepted). */
  async getAllAdmins(): Promise<Admin[]> {
    const [usersResponse, invites] = await Promise.all([adminApiClient.get<{ data?: RawUser[] } | RawUser[]>('/users'), adminApiClient.get<RawInvite[]>('/users/invites/pending')]);
    const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.data || [];

    // Only real admin accounts — riders (role 'rider') used to show up as "Viewer" admins.
    const admins: Admin[] = users
      .filter((u) => u.role === 'admin')
      .map((u) => ({
        id: u.id,
        kind: 'admin',
        name: u.name || u.email || `Admin #${u.id}`,
        email: u.email || '',
        phone: u.phoneNumber || u.phone || null,
        role: mapRole(u.adminRole || 'viewer'),
        status: u.isActive === false ? 'Suspended' : 'Active',
        permissions: u.permissions,
        customPermissions: u.customPermissions,
        lastLoginAt: u.lastLoginAt ?? null,
        createdAt: u.createdAt,
      }));

    const pending: Admin[] = (Array.isArray(invites) ? invites : []).map((i) => ({
      id: Number(String(i.id).replace('invite-', '')),
      kind: 'invite',
      name: i.name || i.email || 'Invited admin',
      email: i.email || '',
      phone: null,
      role: mapRole(i.adminRole || 'viewer'),
      status: i.status === 'expired' ? 'Expired' : 'Invited',
      permissions: i.permissions,
      customPermissions: i.customPermissions,
      lastLoginAt: null,
      createdAt: i.createdAt,
      expiresAt: i.expiresAt,
    }));

    return [...admins, ...pending];
  }
}
