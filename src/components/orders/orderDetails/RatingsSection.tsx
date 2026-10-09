
interface RatingsSectionProps {
  riderRatingData: { rating: number; comment?: string } | null;
  productReviewsData: Array<{ productId: number; productName: string; rating: number; comment?: string }>;
}

// Rider rating + product reviews, or an empty state when there's neither.
// Split out of the former monolithic OrderDetailsDrawer.
export default function RatingsSection({ riderRatingData, productReviewsData }: RatingsSectionProps) {
  if (!riderRatingData && productReviewsData.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="text-xs font-semibold text-gray-500 mb-1">⭐ CUSTOMER FEEDBACK</div>
        <div className="text-sm text-gray-400">No ratings yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {riderRatingData && (
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <div className="text-xs font-semibold text-amber-700 mb-2">⭐ RIDER RATING</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{'⭐'.repeat(riderRatingData.rating)}{'☆'.repeat(5 - riderRatingData.rating)}</span>
            <span className="text-lg font-bold text-amber-700">{riderRatingData.rating}/5</span>
          </div>
          {riderRatingData.comment && (
            <div className="text-sm text-gray-700 mt-2 italic">"{riderRatingData.comment}"</div>
          )}
        </div>
      )}
      {productReviewsData.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-700 mb-2">📝 PRODUCT REVIEWS</div>
          <div className="space-y-2">
            {productReviewsData.map((review, i) => (
              <div key={i} className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">{review.productName}</span>
                  <span className="text-sm">{'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                {review.comment && (
                  <div className="text-xs text-gray-700 italic mt-1">"{review.comment}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
