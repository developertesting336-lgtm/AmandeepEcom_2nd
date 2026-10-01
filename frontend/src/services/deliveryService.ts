const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export interface DeliveryEstimate {
  minDays: number;
  maxDays: number;
  minDate: string;
  maxDate: string;
  formattedRange: string;
  tierLabel: string;
}

export interface DeliveryEstimateResponse {
  success: boolean;
  isDeliverable: boolean;
  pincode: string;
  city?: string;
  state?: string;
  displayName?: string;
  distanceKm?: number;
  shippingFee?: number;
  expectedDelivery?: DeliveryEstimate;
  message?: string;
}

/**
 * Fetch delivery estimation for a pincode
 */
export async function getDeliveryEstimate(pincode: string): Promise<DeliveryEstimateResponse> {
  const cleanPin = pincode.trim();
  if (!cleanPin) {
    throw new Error("Pincode is required");
  }

  const response = await fetch(`${API_BASE_URL}/api/delivery/estimate/${encodeURIComponent(cleanPin)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const data: DeliveryEstimateResponse = await response.json();
  return data;
}
