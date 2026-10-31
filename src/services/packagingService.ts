import adminApiClient from './apiClient';

export interface PackagingOption {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  /** What it costs DWOM. Empty uses the flat cost in Finance settings. */
  cost: number | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PackagingInput {
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  cost: number | null;
}

export const packagingService = {
  list: () => adminApiClient.get<PackagingOption[]>('/packaging/admin'),
  create: (data: PackagingInput) => adminApiClient.post<PackagingOption>('/packaging', data),
  update: (id: number, data: Partial<PackagingInput> & { isActive?: boolean; sortOrder?: number }) => adminApiClient.patch<PackagingOption>(`/packaging/${id}`, data),
  remove: (id: number) => adminApiClient.delete<{ id: number }>(`/packaging/${id}`),
};
