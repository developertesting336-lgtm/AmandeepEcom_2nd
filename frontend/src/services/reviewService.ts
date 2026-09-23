const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface ReviewItem {
  _id: string;
  productId: string;
  userId: {
    _id: string;
    name: string;
  };
  stars: number;
  detailedReview: string;
  helpfulVotes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEligibilityResponse {
  success: boolean;
  canReview: boolean;
  hasReviewed: boolean;
  review?: ReviewItem | null;
  deliveredOrder?: any;
  message?: string;
}

export interface SubmitReviewPayload {
  productId: string;
  stars: number;
  detailedReview: string;
}

export interface SubmitReviewResponse {
  success: boolean;
  isUpdated?: boolean;
  message?: string;
  data?: {
    review: ReviewItem;
  };
}

export interface ProductReviewsResponse {
  success: boolean;
  message?: string;
  data?: {
    ratingsAverage: number;
    ratingsCount: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
    reviews: ReviewItem[];
    pagination: {
      page: number;
      limit: number;
      totalFiltered: number;
      totalPages: number;
    };
  };
}

// 1. Check if the user is eligible to review (has delivered order for this product)
export const checkReviewEligibility = async (
  productId: string,
  token?: string | null
): Promise<ReviewEligibilityResponse> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/reviews/eligibility/${productId}`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      canReview: false,
      hasReviewed: false,
      message: err?.message || "Failed to check eligibility",
    };
  }
};

// 2. Submit new or updated review (upsert)
export const submitReview = async (
  payload: SubmitReviewPayload,
  token?: string | null
): Promise<SubmitReviewResponse> => {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(payload),
    });

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to submit review",
    };
  }
};

// 3. Fetch reviews & ratings breakdown for a product
export const getProductReviews = async (
  productId: string,
  query?: { page?: number; limit?: number; stars?: number; sort?: string }
): Promise<ProductReviewsResponse> => {
  try {
    const params = new URLSearchParams();
    if (query?.page) params.append("page", String(query.page));
    if (query?.limit) params.append("limit", String(query.limit));
    if (query?.stars) params.append("stars", String(query.stars));
    if (query?.sort) params.append("sort", query.sort);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}${queryString}`);
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to fetch reviews",
    };
  }
};

// 4. Delete user's own review
export const deleteReview = async (
  reviewId: string,
  token?: string | null
): Promise<{ success: boolean; message?: string }> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to delete review",
    };
  }
};

// 5. Upvote helpful review
export const voteHelpfulReview = async (
  reviewId: string,
  token?: string | null
): Promise<{ success: boolean; helpfulVotes?: number; message?: string }> => {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Failed to upvote review",
    };
  }
};
