// TypeScript interfaces for Orders page

export type OrderStatus = "Pending" | "Preparing" | "Ready" | "On the way" | "Delivered" | "Canceled";
export type PaymentStatus = "Paid" | "Pending" | "Failed";

export interface RiderSummary {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
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
  total: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  source: string;
  paymentRef?: string;
  coupon?: string;
  subscription?: string;
  timeline: Array<{ status: OrderStatus; time: string }>;
  riderRating?: { rating: number; comment?: string } | null;
  productReviews?: Array<{ productId: number; productName: string; rating: number; comment?: string }>;
}

export interface OrdersFilterState {
  dateRange: [string, string];
  status: OrderStatus | "All";
  paymentStatus: PaymentStatus | "All";
  zone: string | "All";
  rider: string | "All";
  search: string;
}
