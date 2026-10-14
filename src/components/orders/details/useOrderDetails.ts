import { useEffect, useState } from 'react';
import ordersService from '../../../services/ordersService';
import { logger } from '../../../utils/logger';
import type { OrderItem } from '../OrderTypes';
import { normalizeOrderStatus } from '../order-status';

export interface StatusChange {
  id: number;
  status: string;
  changedBy: string;
  changedAt: string;
  notes?: string | null;
}

export interface OrderDetails {
  items: OrderItem[];
  recipient: { name?: string; phone?: string } | null;
  riderNotes?: string;
  statusHistory: StatusChange[];
  riderRating: { rating: number; comment?: string } | null;
  productReviews: Array<{ productId: number; productName: string; rating: number; comment?: string }>;
}

interface RawLine {
  id?: number;
  productId?: number;
  bundleId?: number;
  quantity?: number;
  unitPrice?: number | string;
  discount?: number | string;
  discountedPrice?: number | string;
  discounted_price?: number | string;
  notes?: string | null;
  /** Snapshot of chosen options; older rows may be client-shaped, so only `label` is relied on. */
  selectedVariations?: Array<{ label?: string; groupName?: string }> | null;
  Product?: { nameEnglish?: string };
  Bundle?: { name?: string };
}

interface RawOrder {
  OrderItem?: RawLine[];
  BundleOrderItem?: RawLine[];
  recipientName?: string | null;
  recipientPhone?: string | null;
  riderNotes?: string | null;
  StatusHistory?: StatusChange[];
  RiderRating?: Array<{ rating: number; comment?: string | null }>;
  ProductReview?: Array<{ productId: number; rating: number; comment?: string | null; Product?: { nameEnglish?: string } }>;
}

// Line price after any item discount — mirrors what the customer was charged.
function toItem(line: RawLine, isBundle: boolean): OrderItem {
  const unitPrice = Number(line.unitPrice || 0);
  const discountPercent = Number(line.discount || 0);
  const discountedPrice = Number(line.discountedPrice || line.discounted_price || 0);
  const price =
    discountedPrice > 0 ? discountedPrice : discountPercent > 0 ? unitPrice * (1 - discountPercent / 100) : unitPrice;
  return {
    id: isBundle ? `bundle-${line.id}` : String(line.id ?? `product-${line.productId}`),
    name: isBundle
      ? line.Bundle?.name || `Bundle ${line.bundleId}`
      : line.Product?.nameEnglish || `Product ${line.productId}`,
    quantity: line.quantity || 0,
    price,
    originalPrice: price < unitPrice ? unitPrice : undefined,
    variations: Array.isArray(line.selectedVariations) ? line.selectedVariations.map((v) => v?.label).filter((l): l is string => !!l) : undefined,
    notes: line.notes || undefined,
    isBundle,
  };
}

/** Full order (items, recipient, history, feedback), fetched when the details sheet opens. */
/** `reloadKey` refetches in the background (e.g. after a status change) without blanking the view. */
export function useOrderDetails(orderId: string | null, reloadKey = 0) {
  // Tagged with the order it belongs to, so switching orders never shows the
  // previous order's data and "loading" is derived rather than reset.
  const [result, setResult] = useState<{ id: string; details: OrderDetails | null; error: string | null } | null>(null);

  useEffect(() => {
    const idNum = orderId ? Number.parseInt(orderId, 10) : NaN;
    if (!orderId || !Number.isFinite(idNum)) return;
    let cancelled = false;

    ordersService
      .getById(idNum)
      .then((res) => {
        if (cancelled) return;
        const raw = res as unknown as RawOrder;
        setResult({
          id: orderId,
          error: null,
          details: {
            items: [
              ...(raw.OrderItem ?? []).map((l) => toItem(l, false)),
              ...(raw.BundleOrderItem ?? []).map((l) => toItem(l, true)),
            ],
            recipient:
              raw.recipientName || raw.recipientPhone
                ? { name: raw.recipientName ?? undefined, phone: raw.recipientPhone ?? undefined }
                : null,
            riderNotes: raw.riderNotes ?? undefined,
            statusHistory: (raw.StatusHistory ?? []).map((h) => ({ ...h, status: normalizeOrderStatus(h.status) })),
            riderRating: raw.RiderRating?.[0]
              ? { rating: raw.RiderRating[0].rating, comment: raw.RiderRating[0].comment ?? undefined }
              : null,
            productReviews: (raw.ProductReview ?? []).map((r) => ({
              productId: r.productId,
              productName: r.Product?.nameEnglish || `Product ${r.productId}`,
              rating: r.rating,
              comment: r.comment ?? undefined,
            })),
          },
        });
      })
      .catch((err) => {
        logger.error('❌ [OrderDetails] Failed to load order details:', err);
        if (!cancelled) {
          setResult({ id: orderId, details: null, error: err instanceof Error ? err.message : 'Failed to load order details' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  const current = orderId && result?.id === orderId ? result : null;
  return {
    details: current?.details ?? null,
    error: current?.error ?? null,
    loading: orderId !== null && current === null,
  };
}
