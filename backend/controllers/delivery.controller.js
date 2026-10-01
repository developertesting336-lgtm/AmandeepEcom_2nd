import DeliveryPincode from "../models/DeliveryPincode.js";
import {
  fetchCoordinatesByPincode,
  calculateHaversineDistanceKm,
  getPrimaryWarehouse,
  calculateExpectedDelivery,
} from "../utils/delivery.utils.js";

/**
 * @desc   Check expected delivery date and deliverability for a pincode (User/Public)
 * @route  GET /api/delivery/estimate/:pincode
 * @route  POST /api/delivery/estimate
 * @access Public
 */
export async function getDeliveryEstimate(req, res) {
  try {
    const rawPin = req.params.pincode || req.body?.pincode || req.query?.pincode;

    if (!rawPin) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required to calculate delivery estimate.",
      });
    }

    const cleanPin = String(rawPin).trim().toUpperCase();

    const warehouse = await getPrimaryWarehouse();

    let displayName = ''

    // 1. Check if pincode is already in database
    let pinDoc = await DeliveryPincode.findOne({ pincode: cleanPin });

    let lat;
    let lon;
    let city = "";
    let state = "";
    let customMinDays = null;
    let customMaxDays = null;
    let shippingFee = 0;

    if (pinDoc) {
      if (!pinDoc.isDeliverable) {
        return res.status(200).json({
          success: true,
          isDeliverable: false,
          pincode: cleanPin,
          city: pinDoc.city,
          state: pinDoc.state,
          message: `Delivery is currently not available for pincode ${cleanPin}.`,
        });
      }

      lat = pinDoc.latitude;
      lon = pinDoc.longitude;
      city = pinDoc.city;
      state = pinDoc.state;
      customMinDays = pinDoc.customMinDays;
      customMaxDays = pinDoc.customMaxDays;
      shippingFee = pinDoc.shippingFee || 0;
    } else {
      // 2. If not stored in DB, geocode dynamically
      const geoResult = await fetchCoordinatesByPincode(cleanPin);

      if (!geoResult.success) {
        return res.status(404).json({
          success: false,
          isDeliverable: false,
          pincode: cleanPin,
          message: geoResult.error || `Unable to find delivery location for pincode ${cleanPin}.`,
        });
      }

      lat = geoResult.latitude;
      lon = geoResult.longitude;
      city = geoResult.city;
      state = geoResult.state;
      displayName = geoResult.displayName || "";

      // Cache this pincode into DB for instant future queries
      try {
        const dist = calculateHaversineDistanceKm(
          warehouse.latitude,
          warehouse.longitude,
          lat,
          lon
        );
        pinDoc = await DeliveryPincode.create({
          pincode: cleanPin,
          latitude: lat,
          longitude: lon,
          city,
          state,
          district: geoResult.district || "",
          displayName: geoResult.displayName || "",
          placeId: geoResult.placeId || "",
          distanceFromWarehouseKm: dist,
          isDeliverable: true,
        });
      } catch (cacheErr) {
        // Non-blocking if already saved in race condition
      }
    }

    // console.log("pinDoc", pinDoc.displayName)

    if (pinDoc) {
      displayName = pinDoc.displayName || "";
      // displayName = "";
    }

    // 3. Compute distance from primary warehouse
    const distanceKm = calculateHaversineDistanceKm(
      warehouse.latitude,
      warehouse.longitude,
      lat,
      lon
    );

    // 4. Calculate expected delivery dates
    const delivery = calculateExpectedDelivery(
      distanceKm,
      warehouse,
      customMinDays,
      customMaxDays
    );

    return res.status(200).json({
      success: true,
      isDeliverable: true,
      pincode: cleanPin,
      city,
      state,
      displayName,
      distanceKm,
      shippingFee,
      expectedDelivery: {
        minDays: delivery.totalMinDays,
        maxDays: delivery.totalMaxDays,
        minDate: delivery.minDeliveryDate,
        maxDate: delivery.maxDeliveryDate,
        formattedRange: delivery.formattedDateRange,
        tierLabel: delivery.tierLabel,
      },
      message: `Expected delivery: ${delivery.formattedDateRange}`,
    });
  } catch (error) {
    console.error("Error in getDeliveryEstimate:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to calculate delivery estimate.",
    });
  }
}
