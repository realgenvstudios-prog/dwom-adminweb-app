import adminApiClient from './apiClient';

export interface Expense {
  id: number;
  date: string;
  category: string;
  amount: number;
  isCapex: boolean;
  recurring: boolean;
  paidBy: string | null;
  paymentMethod: string | null;
  receiptUrl: string | null;
  approvedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  date: string;
  category: string;
  amount: number;
  isCapex?: boolean;
  recurring?: boolean;
  paidBy?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  approvedBy?: string;
  notes?: string;
}

export const EXPENSE_CATEGORIES = [
  'Kayayie / Picker fees',
  'Rider costs',
  'Packaging',
  'Fuel & transport',
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Equipment',
  'Other',
];

class ExpensesService {
  async getAll(filters?: { startDate?: string; endDate?: string; category?: string; isCapex?: boolean }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.isCapex !== undefined) params.set('isCapex', String(filters.isCapex));
    const query = params.toString();
    return adminApiClient.get<Expense[]>(`/expenses${query ? `?${query}` : ''}`);
  }

  async create(input: CreateExpenseInput): Promise<Expense> {
    return adminApiClient.post<Expense>('/expenses', input);
  }

  async update(id: number, input: Partial<CreateExpenseInput>): Promise<Expense> {
    return adminApiClient.patch<Expense>(`/expenses/${id}`, input);
  }

  async remove(id: number): Promise<void> {
    await adminApiClient.delete(`/expenses/${id}`);
  }
}

export default new ExpensesService();
