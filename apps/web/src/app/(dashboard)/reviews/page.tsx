"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Star, MessageSquare, Loader2, TrendingUp } from "lucide-react";
import { formatDate } from "@/lib/utils";

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} style={{ fontSize: size, color: s <= rating ? "#F59E0B" : "#D1D5DB", lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-8 text-right text-gray-500">{label}★</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-xs text-gray-400">{count}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["pharmacy-reviews"],
    queryFn: () => api.get("/v1/pharmacy/reviews?limit=50").then(r => r.data),
  });

  const reviews: any[] = data?.reviews ?? [];
  const avg: number = data?.averageRating ?? 0;
  const total: number = data?.reviewCount ?? 0;

  // Count per star
  const starCounts = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: reviews.filter((r: any) => r.rating === s).length,
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading reviews…
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-400 fill-amber-400" /> Ratings & Reviews
        </h1>
        <p className="text-sm text-gray-500 mt-1">Customer feedback from delivered orders</p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex gap-8">
        {/* Big rating */}
        <div className="flex flex-col items-center justify-center flex-shrink-0 w-32">
          <p className="text-5xl font-black text-gray-900">{avg > 0 ? avg.toFixed(1) : "—"}</p>
          <StarDisplay rating={Math.round(avg)} size={18} />
          <p className="text-xs text-gray-400 mt-1">{total} review{total !== 1 ? "s" : ""}</p>
        </div>

        {/* Bar breakdown */}
        <div className="flex-1 space-y-2 justify-center flex flex-col">
          {starCounts.map(({ star, count }) => (
            <RatingBar key={star} label={star.toString()} count={count} total={total} />
          ))}
        </div>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <MessageSquare className="h-10 w-10 mb-3 opacity-20" />
          <p className="font-medium text-gray-600">No reviews yet</p>
          <p className="text-sm mt-1">Reviews appear here after customers rate their delivered orders</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: any) => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">
                      {review.appUser?.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{review.appUser?.name ?? "Customer"}</p>
                    <StarDisplay rating={review.rating} />
                  </div>
                </div>
                <p className="text-xs text-gray-400 flex-shrink-0">{formatDate(review.createdAt)}</p>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 ml-12 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
