export interface Admin {
  id: number | string; // string for a still-pending invite ("invite-5"), see getAllAdmins()
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
  adminId: number | string;
  adminName: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}
