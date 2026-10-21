import type { Order } from './OrderTypes';
import { orderStatusMeta, paymentMethodMeta, paymentStatusMeta } from './order-status';
import { addressLine, mapsUrl, plusCodeOf } from '../address/address-utils';

function cell(value: string | number): string {
  let s = String(value);
  // Names/addresses are customer-entered: stop spreadsheets treating "=…" as a formula.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Download the given orders as a CSV file, built entirely from data already loaded on the page. */
export function downloadOrdersCsv(orders: Order[]): void {
  const header = [
    'Order ID',
    'Placed',
    'Customer',
    'Phone',
    'Delivery address',
    'Plus Code',
    'Map link',
    'Zone',
    'Rider',
    'Picker',
    'Items',
    'Subtotal',
    'Delivery fee',
    'Service fee',
    'Discount',
    'Total',
    'Payment status',
    'Payment method',
    'Status',
  ];
  const rows = orders.map((o) => [
    o.id,
    new Date(o.createdAt).toISOString(),
    o.customer,
    o.phone,
    addressLine(o.address, o.place),
    plusCodeOf(o.address, o.place) ?? '',
    mapsUrl(o.place, plusCodeOf(o.address, o.place)) ?? '',
    o.zone ?? '',
    o.rider?.name ?? '',
    o.picker?.name ?? '',
    o.itemsCount,
    o.subtotal.toFixed(2),
    o.deliveryFee.toFixed(2),
    o.serviceFee.toFixed(2),
    o.couponDiscount.toFixed(2),
    o.total.toFixed(2),
    paymentStatusMeta(o.paymentStatus).label,
    paymentMethodMeta(o.paymentMethod).label,
    orderStatusMeta(o.orderStatus).label,
  ]);

  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  // BOM so Excel opens GH₵/accented names correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dwom-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
