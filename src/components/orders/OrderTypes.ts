// TypeScript interfaces for Orders page

// Backend statuses (normalized lowercase): 'sorting' | 'ready' | 'rider on the way' | 'rider has arrived' | 'delivered' | 'cancelled'
export type OrderStatus = string;
// Backend payment statuses (normalized lowercase): 'pending' | 'paid' | 'failed'
export type PaymentStatus = string;

export interface RiderSummary {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice?: number;
}

export interface Order {
  id: string;
  time: string;
  customer: string;
  phone: string;
  address: string;
  zone: string;
  rider: RiderSummary | null;
  items: OrderItem[];
  itemsCount?: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string; // 'card' | 'momo' | 'cash'
  orderStatus: string;
  source: string;
  paymentRef?: string;
  coupon?: string;
  subscription?: string;
  timeline: Array<{ status: string; time: string }>;
  riderRating?: { rating: number; comment?: string } | null;
  productReviews?: Array<{ productId: number; productName: string; rating: number; comment?: string }>;
}

export interface OrdersFilterState {
  dateRange: [string, string];
  status: string;
  paymentStatus: string;
  zone: string;
  rider: string;
  search: string;
}
