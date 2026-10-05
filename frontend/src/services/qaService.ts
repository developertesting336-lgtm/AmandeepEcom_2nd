import { API_BASE_URL } from "../config/api";

export interface QAItem {
  _id: string;
  productId: string;
  product?: {
    _id: string;
    name: string;
    images?: Array<{ url: string; alt?: string; isPrimary?: boolean } | string>;
    image?: string;
    price?: number;
    salePrice?: number;
  };
  question: string;
  askedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  answer?: string | null;
  answeredBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  status: "pending" | "answered";
  askedAt: string;
  answeredAt?: string | null;
}

export interface AdminQAResponse {
  success: boolean;
  total: number;
  page: number;
  totalPages: number;
  questions: QAItem[];
}

export interface AnswerQuestionResponse {
  success: boolean;
  message: string;
  question: QAItem;
}

export interface ProductQAsResponse {
  success: boolean;
  count: number;
  productId: string;
  product?: any;
  questions: QAItem[];
}

// 1. Fetch all questions for Admin (supports filtering by status & pagination)
export const fetchAdminQAs = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<AdminQAResponse> => {
  const token = localStorage.getItem("token");

  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());

  const url = `${API_BASE_URL}/api/qa/all?${query.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch questions.");
  }

  return data;
};

// 2. Answer a specific question (Admin only)
export const answerQuestionApi = async (
  questionId: string,
  answer: string
): Promise<AnswerQuestionResponse> => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/qa/answer/${questionId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ answer }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit answer.");
  }

  return data;
};

// 3. Get answered questions for a specific product
export const fetchProductQAs = async (
  productId: string
): Promise<ProductQAsResponse> => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/qa/product/${productId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch product questions.");
  }

  return data;
};

// 4. Ask a question about a product (Authenticated user)
export interface AskQuestionPayload {
  productId: string;
  question: string;
}

export interface AskQuestionResponse {
  success: boolean;
  message: string;
  productQA: any;
}

export const askQuestionApi = async (
  payload: AskQuestionPayload
): Promise<AskQuestionResponse> => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/qa/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit question.");
  }

  return data;
};
