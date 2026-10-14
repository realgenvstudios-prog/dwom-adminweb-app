export type AdminRole = 'Super Admin' | 'Operations' | 'Warehouse' | 'Riders' | 'Finance' | 'Marketing' | 'Support' | 'Viewer';

/** One row on the Admins page: a real admin account, or an invite not yet accepted. */
export interface Admin {
  /** Account id (kind 'admin') or AdminInvite id (kind 'invite') — the two id spaces overlap, so always check `kind`. */
  id: number;
  kind: 'admin' | 'invite';
  name: string;
  email: string;
  phone: string | null;
  role: AdminRole;
  /** Invited = sent, not yet accepted. Admin accounts are Active or Suspended. */
  status: 'Active' | 'Invited' | 'Suspended';
  lastLoginAt: string | null;
  createdAt?: string;
  /** Invites only: when the link stops working. */
  expiresAt?: string;
}

export interface AdminMetrics {
  totalAdmins: number;
  activeAdmins: number;
  /** Invites sent and not yet accepted. */
  pendingAdmins: number;
  suspendedAdmins: number;
  roleCounts: Record<string, number>;
}
