import { API_BASE_URL } from "../config/api";

export interface InquiryPayload {
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  orderId?: string;
  message: string;
}

export interface InquiryResponse {
  success: boolean;
  message: string;
  inquiry?: {
    id: string;
    name: string;
    email: string;
    subject: string;
    category: string;
    createdAt: string;
  };
}

export interface InquiryItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  orderId?: string;
  message: string;
  status: "unread" | "in-progress" | "resolved" | "closed";
  notes?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminInquiriesResponse {
  success: boolean;
  inquiries: InquiryItem[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

// 1. Submit public/user inquiry
export const submitContactInquiry = async (
  payload: InquiryPayload
): Promise<InquiryResponse> => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/contact`, {
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
    throw new Error(data.message || "Failed to submit inquiry. Please try again.");
  }

  return data;
};

// 2. Fetch inquiries for admin
export const fetchAdminInquiries = async (params?: {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AdminInquiriesResponse> => {
  const token = localStorage.getItem("token");

  const query = new URLSearchParams();
  if (params?.status && params.status !== "all") query.set("status", params.status);
  if (params?.category && params.category !== "all") query.set("category", params.category);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());

  const url = `${API_BASE_URL}/api/contact?${query.toString()}`;

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
    throw new Error(data.message || "Failed to fetch inquiries.");
  }

  return data;
};

// 3. Update inquiry status or notes (admin)
export const updateInquiryStatusApi = async (
  id: string,
  payload: { status?: string; notes?: string }
): Promise<{ success: boolean; message: string; inquiry: InquiryItem }> => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/contact/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update inquiry.");
  }

  return data;
};

// 4. Delete inquiry (admin)
export const deleteInquiryApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/contact/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete inquiry.");
  }

  return data;
};
