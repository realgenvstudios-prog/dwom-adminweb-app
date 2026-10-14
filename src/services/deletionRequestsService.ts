import adminApiClient from './apiClient';

export type DeletionStatus = 'PENDING' | 'VERIFIED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

/** A customer's request to have their account erased (GET /account/deletion-requests). */
export interface DeletionRequest {
  id: number;
  phoneNumber: string;
  email: string;
  reason?: string | null;
  status: DeletionStatus;
  requestedAt: string;
  scheduledDeletionDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  approvedBy?: string | null;
}

export type DeletionAction = 'verify' | 'approve' | 'complete' | 'reject';

// All Super Admin only server-side.
const deletionRequestsService = {
  async getAll(): Promise<DeletionRequest[]> {
    const data = await adminApiClient.get<DeletionRequest[]>('/account/deletion-requests');
    return Array.isArray(data) ? data : [];
  },

  /** verify: PENDING→VERIFIED · approve: VERIFIED→APPROVED (due in 30 days) · complete: erase (when due) · reject: PENDING/VERIFIED→REJECTED */
  async act(id: number, action: DeletionAction, notes?: string): Promise<DeletionRequest> {
    return adminApiClient.put<DeletionRequest>(`/account/deletion-requests/${id}/${action}`, notes ? { notes } : {});
  },
};

export default deletionRequestsService;
