import adminApiClient from './apiClient';

export type Vehicle = 'motorbike' | 'bicycle' | 'car';
export type DocRule = 'required' | 'optional' | 'off';
export type ApprovalStatus = 'incomplete' | 'pending' | 'changes_requested' | 'rejected' | 'approved';
export type DocState = 'missing' | 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApplicationRow {
  id: number;
  name: string;
  phone: string;
  vehicleType: Vehicle;
  approvalStatus: ApprovalStatus;
  submittedAt: string | null;
  createdAt: string;
  documents: { total: number; pending: number; rejected: number };
  payoutReady: boolean;
  briefingDone: boolean;
}

export interface DocUpload {
  id: number;
  status: 'pending' | 'approved' | 'rejected';
  number: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  uploadedAt: string;
  /** Short-lived private links (about 10 minutes). */
  files?: string[];
}

export interface DocRequirement {
  key: string;
  name: string;
  description: string | null;
  sides: number;
  hasNumber: boolean;
  numberLabel: string | null;
  hasExpiry: boolean;
  rule: DocRule;
  state: DocState;
  current: DocUpload | null;
  history?: DocUpload[];
}

export interface Application {
  rider: {
    id: number;
    name: string;
    phone: string;
    joinedAt: string;
    vehicleType: Vehicle;
    approvalStatus: ApprovalStatus;
    rejectionReason: string | null;
    submittedAt: string | null;
    approvedAt: string | null;
    briefingCompletedAt: string | null;
    payout: { method: 'momo' | 'bank'; bankName: string; accountNumber: string; accountName: string | null } | null;
  };
  documents: DocRequirement[];
  events: { id: number; type: string; data: Record<string, unknown> | null; createdAt: string }[];
}

export interface DocumentType {
  id: number;
  key: string;
  name: string;
  description: string | null;
  capture: 'camera' | 'upload';
  sides: number;
  hasNumber: boolean;
  numberLabel: string | null;
  hasExpiry: boolean;
  rules: Partial<Record<Vehicle, DocRule>>;
  sortOrder: number;
  active: boolean;
  /** One of DWOM's standard documents: can be switched off, not deleted. */
  builtIn: boolean;
}

export type DocumentTypeInput = Partial<Omit<DocumentType, 'id' | 'key' | 'builtIn'>>;

const riderApplicationsService = {
  list: (status?: string) => adminApiClient.get<ApplicationRow[]>(`/riders/admin/applications${status ? `?status=${status}` : ''}`),
  get: (riderId: number) => adminApiClient.get<Application>(`/riders/admin/applications/${riderId}`),
  approve: (riderId: number) => adminApiClient.post<Application>(`/riders/admin/applications/${riderId}/approve`),
  decline: (riderId: number, outcome: 'changes_requested' | 'rejected', reason: string) =>
    adminApiClient.post<Application>(`/riders/admin/applications/${riderId}/decline`, { outcome, reason }),
  reviewDocument: (documentId: number, decision: 'approved' | 'rejected', reason?: string) =>
    adminApiClient.post<Application>(`/riders/admin/documents/${documentId}/review`, { decision, reason }),
  documentTypes: () => adminApiClient.get<DocumentType[]>('/riders/admin/document-types'),
  createDocumentType: (input: DocumentTypeInput & { name: string }) => adminApiClient.post<DocumentType>('/riders/admin/document-types', input),
  updateDocumentType: (id: number, input: DocumentTypeInput) => adminApiClient.patch<DocumentType>(`/riders/admin/document-types/${id}`, input),
  deleteDocumentType: (id: number) => adminApiClient.delete<{ deleted: boolean }>(`/riders/admin/document-types/${id}`),
};

export default riderApplicationsService;
