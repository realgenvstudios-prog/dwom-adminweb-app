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
  /** Added with Add to order. */
  added?: boolean;
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
  /** The total when placed, once the order has changed. */
  originalTotal: number | null;
  /** Extra the rider collects on a card or MoMo order. */
  balanceAtDoor: number;
  newItemsToAcknowledge: boolean;
  /** Items waiting on the customer's choice. */
  openIssues: number;
  couponDiscount: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string; // 'card' | 'momo' | 'cash'
  orderStatus: string;
  paymentRef?: string;
}
