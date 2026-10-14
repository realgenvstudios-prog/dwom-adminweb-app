import adminApiClient from './apiClient';

export interface FounderLedgerEntry {
  id: number;
  date: string;
  type: 'contribution' | 'reimbursement';
  founderName: string;
  amount: number;
  method: string | null;
  notes: string | null;
  receiptUrl: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FounderBalance {
  totalContributions: number;
  totalReimbursements: number;
  balance: number;
  byFounder: { founderName: string; contributions: number; reimbursements: number; balance: number }[];
}

export interface CreateFounderLedgerEntryInput {
  date: string;
  type: 'contribution' | 'reimbursement';
  founderName: string;
  amount: number;
  method?: string;
  notes?: string;
  approvedBy?: string;
  receiptUrl?: string;
}

class FounderLedgerService {
  async getAll(filters?: { founderName?: string; type?: string }): Promise<FounderLedgerEntry[]> {
    const params = new URLSearchParams();
    if (filters?.founderName) params.set('founderName', filters.founderName);
    if (filters?.type) params.set('type', filters.type);
    const query = params.toString();
    return adminApiClient.get<FounderLedgerEntry[]>(`/founder-ledger${query ? `?${query}` : ''}`);
  }

  async getBalance(): Promise<FounderBalance> {
    return adminApiClient.get<FounderBalance>('/founder-ledger/balance');
  }

  async create(input: CreateFounderLedgerEntryInput): Promise<FounderLedgerEntry> {
    return adminApiClient.post<FounderLedgerEntry>('/founder-ledger', input);
  }

  async update(id: number, input: Partial<CreateFounderLedgerEntryInput>): Promise<FounderLedgerEntry> {
    return adminApiClient.patch<FounderLedgerEntry>(`/founder-ledger/${id}`, input);
  }

  async remove(id: number): Promise<void> {
    await adminApiClient.delete(`/founder-ledger/${id}`);
  }
}

export default new FounderLedgerService();
