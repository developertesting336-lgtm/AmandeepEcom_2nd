// Address Service for Checkout & User Profile
// Supports multi-address management (up to 3 addresses), tags (Home/Work/Other), and validation.

export type AddressTag = "Home" | "Work" | "Other";

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  tag: AddressTag;
  isDefault?: boolean;
}

export interface AddressFormErrors {
  fullName?: string;
  phone?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

// STORAGE KEY & API
const STORAGE_KEY = "shopora_saved_addresses";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * Validates address fields and returns an error object if invalid.
 */
export const validateAddress = (address: Partial<Address>): AddressFormErrors => {
  const errors: AddressFormErrors = {};

  // Full Name validation
  if (!address.fullName || address.fullName.trim().length < 3) {
    errors.fullName = "Please enter a valid full name (at least 3 characters).";
  }

  // Phone validation (10-digit Indian phone, with optional +91 or 0 prefix)
  const cleanPhone = (address.phone || "").replace(/[\s\-()]/g, "");
  const phoneRegex = /^(?:\+91|91|0)?[6-9]\d{9}$/;
  if (!cleanPhone || !phoneRegex.test(cleanPhone)) {
    errors.phone = "Please enter a valid 10-digit mobile number (starts with 6-9).";
  }

  // Address Line validation
  if (!address.addressLine || address.addressLine.trim().length < 6) {
    errors.addressLine = "Please enter complete street address (at least 6 characters).";
  }

  // City validation
  if (!address.city || address.city.trim().length < 2) {
    errors.city = "Please enter city name.";
  }

  // State validation
  if (!address.state || address.state.trim().length < 2) {
    errors.state = "Please enter state.";
  }

  // Pincode validation (6 digits)
  const pinRegex = /^[1-9][0-9]{5}$/;
  if (!address.pincode || !pinRegex.test(address.pincode.trim())) {
    errors.pincode = "Please enter a valid 6-digit postal pincode.";
  }

  return errors;
};

/**
 * Fetches the user's saved shipping addresses (max 3).
 * Checks backend API first, then falls back to localStorage.
 * Returns an empty array if no addresses exist.
 */
export const fetchUserAddresses = async (token?: string | null): Promise<Address[]> => {
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/user/addresses`, {
      method: "GET",
      headers,
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.addresses || [];
      if (list.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 3)));
        return list.slice(0, 3);
      }
    }
  } catch (error) {
    console.warn("Using local storage fallback for addresses:", error);
  }

  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed: Address[] = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3);
      }
    } catch {
      // parse fallback
    }
  }

  return [];
};

/**
 * Adds a new address or updates an existing one (capped at max 3 addresses).
 */
export const saveUserAddress = async (
  address: Omit<Address, "id"> & { id?: string },
  token?: string | null
): Promise<{ success: boolean; data: Address[]; message?: string; error?: string }> => {
  const currentAddresses = await fetchUserAddresses(token);

  const addressId = address.id || `addr-${Date.now()}`;
  const isDefault = address.isDefault ?? currentAddresses.length === 0;

  const normalizedAddress: Address = {
    ...address,
    id: addressId,
    tag: address.tag || "Home",
    isDefault,
  };

  let updatedList: Address[] = [];

  if (address.id) {
    // Editing existing address
    updatedList = currentAddresses.map((item) =>
      item.id === address.id
        ? normalizedAddress
        : isDefault
          ? { ...item, isDefault: false }
          : item
    );
  } else {
    // Adding new address (max 3)
    if (currentAddresses.length >= 3) {
      return {
        success: false,
        data: currentAddresses,
        error: "You can save up to 3 addresses only. Please edit or remove an existing one.",
      };
    }

    const previousList = isDefault
      ? currentAddresses.map((a) => ({ ...a, isDefault: false }))
      : currentAddresses;

    updatedList = [...previousList, normalizedAddress];
  }

  // Persist locally
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  // Sync to API in background
  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    await fetch(`${API_BASE_URL}/api/user/addresses`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(normalizedAddress),
    });
  } catch (apiErr) {
    console.warn("API address save failed, saved locally:", apiErr);
  }

  return { success: true, data: updatedList, message: "Address saved successfully." };
};

/**
 * Deletes an address by ID.
 */
export const deleteUserAddress = async (
  addressId: string,
  token?: string | null
): Promise<{ success: boolean; data: Address[] }> => {
  const currentAddresses = await fetchUserAddresses(token);
  let updatedList = currentAddresses.filter((a) => a.id !== addressId);

  // If deleted address was default and other addresses exist, make the first one default
  if (updatedList.length > 0 && !updatedList.some((a) => a.isDefault)) {
    updatedList[0].isDefault = true;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

  try {
    const activeToken = token || localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (activeToken) {
      headers["Authorization"] = `Bearer ${activeToken}`;
    }

    await fetch(`${API_BASE_URL}/api/user/addresses/${addressId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });
  } catch (err) {
    console.warn("API address delete failed, deleted locally:", err);
  }

  return { success: true, data: updatedList };
};

/**
 * Sets a specific address as default.
 */
export const setDefaultAddress = async (
  addressId: string,
  token?: string | null
): Promise<{ success: boolean; data: Address[] }> => {
  const currentAddresses = await fetchUserAddresses(token);
  const updatedList = currentAddresses.map((a) => ({
    ...a,
    isDefault: a.id === addressId,
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  return { success: true, data: updatedList };
};
