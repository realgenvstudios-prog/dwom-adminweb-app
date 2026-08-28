import adminApiClient from './apiClient';

export interface OrderEvent {
  id: number;
  orderId: number;
  stage: string;
  performedBy?: string;
  occurredAt: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateOrderEventDto {
  stage: string;
  performedBy?: string;
  occurredAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// Starting vocabulary, not a rigid whitelist — the backend accepts any
// string, this is just what the picker offers by default.
export const SUGGESTED_ORDER_EVENT_STAGES = [
  'supplier_contacted',
  'supplier_paid',
  'kayayo_dispatched',
  'arrived_at_hub',
  'qc_completed',
] as const;

export const formatStageLabel = (stage: string): string =>
  stage
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const orderEventsService = {
  async getForOrder(orderId: number): Promise<OrderEvent[]> {
    return adminApiClient.get<OrderEvent[]>(`/orders/${orderId}/events`);
  },

  async logEvent(orderId: number, dto: CreateOrderEventDto): Promise<OrderEvent> {
    return adminApiClient.post<OrderEvent>(`/orders/${orderId}/events`, dto);
  },
};

export default orderEventsService;
