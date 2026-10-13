import adminApiClient from './apiClient';

export interface Worker {
  id: number;
  name: string;
  phone: string | null;
  type: string;
  standardRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripOrder {
  id: number;
  tripId: number;
  orderId: number;
  costShare: number;
}

export interface Trip {
  id: number;
  workerId: number;
  date: string;
  totalCost: number;
  notes: string | null;
  Worker: Worker;
  TripOrder: TripOrder[];
}

export interface CreateWorkerInput {
  name: string;
  phone?: string;
  type?: string;
  standardRate?: number;
}

export interface CreateTripInput {
  workerId: number;
  date?: string;
  totalCost?: number;
  orderIds?: number[];
  notes?: string;
}

class WorkersService {
  async getAll(includeInactive = false): Promise<Worker[]> {
    return adminApiClient.get<Worker[]>(`/workers?includeInactive=${includeInactive}`);
  }

  async create(input: CreateWorkerInput): Promise<Worker> {
    return adminApiClient.post<Worker>('/workers', input);
  }

  async update(id: number, input: Partial<CreateWorkerInput> & { active?: boolean }): Promise<Worker> {
    return adminApiClient.patch<Worker>(`/workers/${id}`, input);
  }

  async getTrips(workerId?: number): Promise<Trip[]> {
    return adminApiClient.get<Trip[]>(`/trips${workerId ? `?workerId=${workerId}` : ''}`);
  }

  async createTrip(input: CreateTripInput): Promise<Trip> {
    return adminApiClient.post<Trip>('/trips', input);
  }

  async deleteTrip(id: number): Promise<void> {
    await adminApiClient.delete(`/trips/${id}`);
  }
}

export default new WorkersService();
