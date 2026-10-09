import { useEffect, useMemo, useState } from "react";
import type { Order } from "../OrderTypes";
import ordersService from "../../../services/ordersService";

// Fetches the full order (items, recipient, ratings, reviews) whenever the
// drawer opens for a given order id. Split out of the former monolithic
// OrderDetailsDrawer.
export function useOrderDetailsData(order: Order | null, open: boolean) {
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsItems, setDetailsItems] = useState<Order['items']>([]);
  const [riderRatingData, setRiderRatingData] = useState<{ rating: number; comment?: string } | null>(null);
  const [recipientInfo, setRecipientInfo] = useState<{ name?: string; phone?: string } | null>(null);
  const [productReviewsData, setProductReviewsData] = useState<Array<{ productId: number; productName: string; rating: number; comment?: string }>>([]);

  const orderIdNum = useMemo(() => {
    if (!order?.id) return null;
    const idNum = Number.parseInt(order.id, 10);
    return Number.isFinite(idNum) ? idNum : null;
  }, [order?.id]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!open || !orderIdNum) return;
      try {
        setDetailsLoading(true);
        setDetailsError(null);
        console.log(`📦 [OrderDetailsDrawer] Fetching full order details for ${orderIdNum}`);
        const fullOrder: any = await ordersService.getById(orderIdNum);

        const productItems = (fullOrder?.OrderItem || []).map((item: any) => {
          const unitPrice = Number(item.unitPrice || 0);
          const discountPercent = Number(item.discount || 0);
          const discountedPrice = Number(item.discountedPrice || item.discounted_price || 0);
          const effectivePrice = discountedPrice > 0 ? discountedPrice
            : (discountPercent > 0 ? unitPrice * (1 - discountPercent / 100) : unitPrice);
          return {
            id: item.id?.toString() || `product-${item.productId}`,
            name: item.Product?.nameEnglish || `Product ${item.productId}`,
            quantity: item.quantity || 0,
            price: effectivePrice,
            originalPrice: effectivePrice < unitPrice ? unitPrice : undefined,
            notes: item.notes || undefined,
          };
        });

        const bundleItems = (fullOrder?.BundleOrderItem || []).map((item: any) => {
          const unitPrice = Number(item.unitPrice || 0);
          const discountPercent = Number(item.discount || 0);
          const discountedPrice = Number(item.discountedPrice || item.discounted_price || 0);
          const effectivePrice = discountedPrice > 0 ? discountedPrice
            : (discountPercent > 0 ? unitPrice * (1 - discountPercent / 100) : unitPrice);
          return {
            id: `bundle-${item.id}`,
            name: `📦 ${item.Bundle?.name || `Bundle ${item.bundleId}`}`,
            quantity: item.quantity || 0,
            price: effectivePrice,
            originalPrice: effectivePrice < unitPrice ? unitPrice : undefined,
            notes: item.notes || undefined,
          };
        });

        setDetailsItems([...productItems, ...bundleItems]);

        // Who this specific order was actually handed to (snapshotted at
        // order time — see backend OrdersService.resolveRecipient), not
        // necessarily the account holder.
        if (fullOrder?.recipientName || fullOrder?.recipientPhone) {
          setRecipientInfo({ name: fullOrder.recipientName, phone: fullOrder.recipientPhone });
        } else {
          setRecipientInfo(null);
        }

        // Extract ratings from full order data
        const riderRating = fullOrder?.RiderRating?.[0];
        if (riderRating) {
          setRiderRatingData({ rating: riderRating.rating, comment: riderRating.comment });
        } else {
          setRiderRatingData(null);
        }

        const reviews = (fullOrder?.ProductReview || []).map((review: any) => ({
          productId: review.productId,
          productName: review.Product?.nameEnglish || `Product ${review.productId}`,
          rating: review.rating,
          comment: review.comment,
        }));
        setProductReviewsData(reviews);

        console.log('✅ [OrderDetailsDrawer] Loaded items:', productItems.length + bundleItems.length, 'ratings:', riderRating ? 'yes' : 'no', 'reviews:', reviews.length);
      } catch (e: any) {
        console.error('❌ [OrderDetailsDrawer] Failed to load order details:', e);
        setDetailsError(e?.message || 'Failed to load order items');
        setDetailsItems([]);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [open, orderIdNum]);

  return { orderIdNum, detailsLoading, detailsError, detailsItems, riderRatingData, recipientInfo, productReviewsData };
}
