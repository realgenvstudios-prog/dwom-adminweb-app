// Statuses are normalized lowercase — see order-status.ts.

export interface PersonSummary {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  originalPrice?: number;
  notes?: string;
  isBundle?: boolean;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: string;
  phone: string;
  address: string;
  rider: PersonSummary | null;
  picker: PersonSummary | null;
  itemsCount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  couponDiscount: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string; // 'card' | 'momo' | 'cash'
  orderStatus: string;
  paymentRef?: string;
}
