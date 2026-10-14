import adminApiClient from '../apiClient';
import type { CustomerGroup } from './marketingTypes';

export interface CustomerGroupInput {
  name: string;
  description?: string;
  userIds: number[];
}

/** Saved sets of customers to message together. */
export const customerGroupsService = {
  list(): Promise<CustomerGroup[]> {
    return adminApiClient.get<CustomerGroup[]>('/marketing/groups');
  },
  create(data: CustomerGroupInput): Promise<CustomerGroup> {
    return adminApiClient.post<CustomerGroup>('/marketing/groups', data);
  },
  update(id: number, data: Partial<CustomerGroupInput>): Promise<CustomerGroup> {
    return adminApiClient.patch<CustomerGroup>(`/marketing/groups/${id}`, data);
  },
  remove(id: number): Promise<{ deleted: boolean }> {
    return adminApiClient.delete(`/marketing/groups/${id}`);
  },
};

export default customerGroupsService;
