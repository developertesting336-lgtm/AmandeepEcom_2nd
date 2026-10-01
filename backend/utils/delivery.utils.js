import Warehouse from "../models/Warehouse.js";

/**
 * Fetch latitude, longitude, and location details for a given pincode.
 * Fallback chain: Zippopotam -> OpenStreetMap Nominatim -> PostalPincode.in
 *
 * @param {string|number} pincode
 * @returns {Promise<{success: boolean, latitude?: number, longitude?: number, city?: string, state?: string, district?: string, country?: string, error?: string}>}
 */
export async function fetchCoordinatesByPincode(pincode) {
  const cleanPin = String(pincode).trim();

  if (!cleanPin || cleanPin.length < 3 || cleanPin.length > 10) {
    return {
      success: false,
      error: "Invalid pincode format. Please provide a valid pincode.",
    };
  }

  // 1. Primary: OpenStreetMap Nominatim with jsonv2 and countrycodes=in
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
      cleanPin
    )}&countrycodes=in&format=jsonv2&addressdetails=1&limit=1`;

    const res = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AmandeepEcomDelivery/1.0 (admin@amandeepecom.com)",
        Accept: "application/json",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const addr = item.address || {};
        const displayName = item.display_name || "";
        const parts = displayName.split(",").map((s) => s.trim());

        // Parse fallback address components from display_name if address details missing
        let parsedCountry = parts.length > 0 ? parts[parts.length - 1] : "India";
        let parsedState = parts.length >= 2 ? parts[parts.length - 2] : "";
        let parsedDistrict = parts.length >= 3 ? parts[parts.length - 3] : "";
        let parsedCity = parts.length >= 4 ? parts[parts.length - 4] : parsedDistrict;

        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.county ||
          addr.suburb ||
          parsedCity ||
          "";

        const state = addr.state || parsedState || "";
        const district = addr.state_district || addr.county || parsedDistrict || "";
        const country = addr.country || parsedCountry || "India";

        return {
          success: true,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          displayName,
          placeId: item.place_id ? String(item.place_id) : "",
          city: city || district,
          state,
          district: district || city,
          country,
          source: "nominatim-jsonv2",
        };
      }
    }
  } catch (err) {
    // Continue to fallback providers
  }

  // 2. Fallback: Zippopotam
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.zippopotam.us/IN/${cleanPin}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const place = data.places && data.places[0];
      if (place && place.latitude && place.longitude) {
        return {
          success: true,
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude),
          displayName: `${cleanPin}, ${place["place name"]}, ${place.state}, ${data.country || "India"}`,
          placeId: "",
          city: place["place name"] || "",
          state: place.state || "",
          district: place.state || "",
          country: data.country || "India",
          source: "zippopotam-fallback",
        };
      }
    }
  } catch (err) {
    // Continue to next provider
  }

  // 3. Try PostalPincode.in to get City/District, then geocode with Nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const district = po.District || "";
        const state = po.State || "";
        const city = po.Name || district;

        // Try geocoding the district/state
        const geoQuery = encodeURIComponent(`${district}, ${state}, India`);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${geoQuery}&format=json&limit=1`,
          {
            headers: {
              "User-Agent": "AmandeepEcomDelivery/1.0 (admin@amandeepecom.com)",
              Accept: "application/json",
            },
          }
        );

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (Array.isArray(geoData) && geoData.length > 0) {
            return {
              success: true,
              latitude: parseFloat(geoData[0].lat),
              longitude: parseFloat(geoData[0].lon),
              city,
              state,
              district,
              country: "India",
              source: "postalpincode+nominatim",
            };
          }
        }

        // Return without coords if geocoding failed, but let caller know
        return {
          success: false,
          city,
          state,
          district,
          error: `Pincode ${cleanPin} is valid (${city}, ${state}), but automatic coordinates could not be determined. Please specify latitude and longitude manually.`,
        };
      }
    }
  } catch (err) {
    // End of fallbacks
  }

  return {
    success: false,
    error: `Could not find for pincode "${cleanPin}". Please check the pincode.`,
  };
}

/**
 * Calculate Great-Circle distance between two coordinates using Haversine Formula.
 *
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in Kilometers (rounded to 1 decimal place)
 */
export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const p1 = parseFloat(lat1);
  const l1 = parseFloat(lon1);
  const p2 = parseFloat(lat2);
  const l2 = parseFloat(lon2);

  if (isNaN(p1) || isNaN(l1) || isNaN(p2) || isNaN(l2)) {
    return 0;
  }

  const R = 6371; // Earth's mean radius in km
  const dLat = ((p2 - p1) * Math.PI) / 180;
  const dLon = ((l2 - l1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1 * Math.PI) / 180) *
    Math.cos((p2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Retrieve primary warehouse or create a default one if none exists.
 *
 * @returns {Promise<Document>}
 */
export async function getPrimaryWarehouse() {
  let warehouse = await Warehouse.findOne({ isPrimary: true });

  if (!warehouse) {
    warehouse = await Warehouse.findOne({});
  }

  if (!warehouse) {
    // Seed default central warehouse
    warehouse = await Warehouse.create({
      name: "Central Logistics Hub",
      pincode: "110001",
      address: "Connaught Place Central Hub",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      latitude: 28.6292,
      longitude: 77.2192,
      isPrimary: true,
      handlingDays: 0,
      speedTiers: [
        { maxDistanceKm: 50, minDays: 1, maxDays: 2, label: "Local Same-City" },
        { maxDistanceKm: 250, minDays: 2, maxDays: 3, label: "Regional" },
        { maxDistanceKm: 600, minDays: 3, maxDays: 4, label: "Zonal" },
        { maxDistanceKm: 1200, minDays: 4, maxDays: 6, label: "National" },
        { maxDistanceKm: 999999, minDays: 6, maxDays: 8, label: "Remote / Outstation" },
      ],
    });
  }

  return warehouse;
}

/**
 * Format a Date object to a readable string like "Fri, 3 Oct"
 */
function formatDateShort(date) {
  const options = { weekday: "short", day: "numeric", month: "short" };
  return date.toLocaleDateString("en-IN", options);
}

/**
 * Calculate expected delivery days, range, and formatted dates based on distance.
 *
 * @param {number} distanceKm
 * @param {object} warehouse
 * @param {number|null} customMinDays
 * @param {number|null} customMaxDays
 * @param {Date} [baseDate=new Date()]
 * @returns {object}
 */
export function calculateExpectedDelivery(
  distanceKm,
  warehouse,
  customMinDays = null,
  customMaxDays = null,
  baseDate = new Date()
) {
  const handlingDays = warehouse?.handlingDays || 0;
  let minDays;
  let maxDays;
  let tierLabel = "Standard Delivery";

  if (
    customMinDays !== null &&
    customMinDays !== undefined &&
    customMaxDays !== null &&
    customMaxDays !== undefined
  ) {
    minDays = Number(customMinDays);
    maxDays = Number(customMaxDays);
    tierLabel = "Custom Delivery Schedule";
  } else {
    const tiers = warehouse?.speedTiers?.length
      ? warehouse.speedTiers
      : [
        { maxDistanceKm: 50, minDays: 1, maxDays: 2, label: "Local Same-City" },
        { maxDistanceKm: 250, minDays: 2, maxDays: 3, label: "Regional" },
        { maxDistanceKm: 600, minDays: 3, maxDays: 4, label: "Zonal" },
        { maxDistanceKm: 1200, minDays: 4, maxDays: 6, label: "National" },
        { maxDistanceKm: 999999, minDays: 6, maxDays: 8, label: "Remote / Outstation" },
      ];

    // Find the matching tier
    const sortedTiers = [...tiers].sort((a, b) => a.maxDistanceKm - b.maxDistanceKm);
    const matchedTier = sortedTiers.find((t) => distanceKm <= t.maxDistanceKm) || sortedTiers[sortedTiers.length - 1];

    minDays = matchedTier.minDays;
    maxDays = matchedTier.maxDays;
    tierLabel = matchedTier.label || "Standard Delivery";
  }

  // Total transit days including warehouse handling
  const totalMinDays = handlingDays + minDays;
  const totalMaxDays = handlingDays + maxDays;

  const minDeliveryDate = new Date(baseDate.getTime());
  minDeliveryDate.setDate(minDeliveryDate.getDate() + totalMinDays);

  const maxDeliveryDate = new Date(baseDate.getTime());
  maxDeliveryDate.setDate(maxDeliveryDate.getDate() + totalMaxDays);

  let formattedDateRange;
  if (totalMinDays === totalMaxDays) {
    formattedDateRange = formatDateShort(minDeliveryDate);
  } else {
    formattedDateRange = `${formatDateShort(minDeliveryDate)} - ${formatDateShort(maxDeliveryDate)}`;
  }

  return {
    distanceKm,
    handlingDays,
    transitMinDays: minDays,
    transitMaxDays: maxDays,
    totalMinDays,
    totalMaxDays,
    minDeliveryDate,
    maxDeliveryDate,
    formattedDateRange,
    tierLabel,
  };
}
