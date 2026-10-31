import type { AddressPlace } from '../address/address-utils';

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
  /** Chosen options, e.g. ["Half crate", "Boiled"]. */
  variations?: string[];
  notes?: string;
  isBundle?: boolean;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: string;
  phone: string;
  address: string;
  /** Place name, Plus Code and pin for the delivery address. */
  place: AddressPlace | null;
  /** Delivery zone name, when the order recorded one. */
  zone: string | null;
  rider: PersonSummary | null;
  picker: PersonSummary | null;
  itemsCount: number;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  smallOrderFee: number;
  packagingName: string | null;
  packagingFee: number;
  couponDiscount: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string; // 'card' | 'momo' | 'cash'
  orderStatus: string;
  paymentRef?: string;
}
