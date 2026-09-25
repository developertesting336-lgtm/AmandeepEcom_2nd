const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface RewardPointTransactionItem {
  _id: string;
  user: string;
  type: "EARNED" | "REDEEMED" | "REFUNDED";
  points: number;
  balanceAfter: number;
  order?: {
    _id: string;
    orderId: string;
    orderStatus?: string;
    orderTotal?: number;
    createdAt?: string;
  };
  orderId?: string;
  product?: {
    _id: string;
    name: string;
    images?: Array<{ url: string } | string>;
    price?: number;
    salePrice?: number;
    slug?: string;
  };
  productName?: string;
  buyer?: {
    _id: string;
    name: string;
    email: string;
  };
  buyerName?: string;
  buyerEmail?: string;
  quantity?: number;
  referralToken?: string;
  discountAmount?: number;
  description?: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED" | string;
  createdAt: string;
  updatedAt?: string;
}

export interface RewardHistoryResponse {
  success: boolean;
  message?: string;
  data: {
    currentBalance: number;
    totalEarned: number;
    totalRedeemed: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      totalCount: number;
    };
    transactions: RewardPointTransactionItem[];
  };
  error?: string;
}

/**
 * Fetch current authenticated user's reward points history (both earned and redeemed)
 */
export const fetchUserRewardHistory = async (
  page: number = 1,
  limit: number = 20,
  type?: "EARNED" | "REDEEMED" | "ALL"
): Promise<RewardHistoryResponse> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (type && type !== "ALL") {
    queryParams.set("type", type);
  }

  const response = await fetch(`${API_BASE_URL}/api/rewards/history?${queryParams.toString()}`, {
    method: "GET",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch reward points history");
  }

  return response.json();
};
