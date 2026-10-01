import DeliveryPincode from "../models/DeliveryPincode.js";
import Warehouse from "../models/Warehouse.js";
import {
  fetchCoordinatesByPincode,
  calculateHaversineDistanceKm,
  getPrimaryWarehouse,
  calculateExpectedDelivery,
} from "../utils/delivery.utils.js";

/**
 * @desc   Add or update a pincode with latitude & longitude and compute distance from warehouse
 * @route  POST /api/admin/delivery/pincode
 * @access Private (Admin only)
 */
/**
 * Helper to fetch lat/lon and location details from Nominatim OpenStreetMap API
 */
async function fetchOsmPincode(pincode) {
  const cleanPin = String(pincode).trim();
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
    cleanPin
  )}&countrycodes=in&format=jsonv2&limit=1`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "AmandeepEcomDelivery/1.0 (admin@amandeepecom.com)",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`OpenStreetMap API error HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const place = data[0];
  const parts = (place.display_name || "").split(",").map((s) => s.trim());
  const country = parts.length > 0 ? parts[parts.length - 1] : "India";
  const state = parts.length >= 2 ? parts[parts.length - 2] : "";
  const district = parts.length >= 3 ? parts[parts.length - 3] : "";
  const city = parts.length >= 4 ? parts[parts.length - 4] : district;

  return {
    pincode: cleanPin,
    latitude: parseFloat(place.lat),
    longitude: parseFloat(place.lon),
    displayName: place.display_name || "",
    placeId: place.place_id ? String(place.place_id) : "",
    city: city || district,
    state,
    district: district || city,
    country,
  };
}

/**
 * @desc   Admin adds a pincode: requests Nominatim API, gets lat/lon, calculates warehouse distance, stores in DB
 * @route  POST /api/admin/delivery/pincode
 * @access Private (Admin only)
 */
export async function addPincode(req, res) {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required.",
      });
    }

    const cleanPin = String(pincode).trim();

    // 1. Request Nominatim OpenStreetMap API
    const geo = await fetchOsmPincode(cleanPin);
    if (!geo) {
      return res.status(404).json({
        success: false,
        message: `No location data found for pincode ${cleanPin} on OpenStreetMap.`,
      });
    }

    // 2. Calculate distance between warehouse and destination pincode
    const warehouse = await getPrimaryWarehouse();
    const distanceKm = calculateHaversineDistanceKm(
      warehouse.latitude,
      warehouse.longitude,
      geo.latitude,
      geo.longitude
    );

    // 3. Store into DB
    const savedPincode = await DeliveryPincode.findOneAndUpdate(
      { pincode: cleanPin },
      {
        $set: {
          pincode: cleanPin,
          latitude: geo.latitude,
          longitude: geo.longitude,
          displayName: geo.displayName,
          placeId: geo.placeId,
          city: geo.city,
          state: geo.state,
          district: geo.district,
          country: geo.country,
          distanceFromWarehouseKm: distanceKm,
          isDeliverable: true,
          createdBy: req.user?._id || null,
        },
      },
      { upsert: true, new: true }
    );

    // Expected delivery calculation
    const deliveryEstimate = calculateExpectedDelivery(distanceKm, warehouse);

    return res.status(201).json({
      success: true,
      message: `Pincode ${cleanPin} added successfully with latitude and longitude.`,
      data: savedPincode,
      warehouse: {
        name: warehouse.name,
        pincode: warehouse.pincode,
        city: warehouse.city,
      },
      deliveryEstimate,
    });
  } catch (error) {
    console.error("Error in addPincode controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add pincode.",
    });
  }
}

/**
 * @desc   Admin bulk adds pincodes: accepts array of pincodes, checks each via OSM API, gets lat/lon and stores in DB
 * @route  POST /api/admin/delivery/pincode/bulk
 * @access Private (Admin only)
 */
export async function bulkAddPincodes(req, res) {
  try {
    const { pincodes } = req.body;

    if (!Array.isArray(pincodes) || pincodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of pincodes in req.body. e.g. { pincodes: ['176401', '110001'] }",
      });
    }

    const warehouse = await getPrimaryWarehouse();
    const successful = [];
    const failed = [];

    for (const item of pincodes) {
      const pin = typeof item === "string" ? item.trim() : item?.pincode ? String(item.pincode).trim() : null;
      if (!pin) {
        failed.push({ pincode: item, reason: "Invalid pincode" });
        continue;
      }

      try {
        const geo = await fetchOsmPincode(pin);
        if (!geo) {
          failed.push({ pincode: pin, reason: "Not found on OpenStreetMap" });
          continue;
        }

        const distanceKm = calculateHaversineDistanceKm(
          warehouse.latitude,
          warehouse.longitude,
          geo.latitude,
          geo.longitude
        );

        const saved = await DeliveryPincode.findOneAndUpdate(
          { pincode: pin },
          {
            $set: {
              pincode: pin,
              latitude: geo.latitude,
              longitude: geo.longitude,
              displayName: geo.displayName,
              placeId: geo.placeId,
              city: geo.city,
              state: geo.state,
              district: geo.district,
              country: geo.country,
              distanceFromWarehouseKm: distanceKm,
              isDeliverable: true,
              createdBy: req.user?._id || null,
            },
          },
          { upsert: true, new: true }
        );

        successful.push({
          pincode: pin,
          latitude: geo.latitude,
          longitude: geo.longitude,
          displayName: geo.displayName,
          city: geo.city,
          state: geo.state,
          distanceFromWarehouseKm: distanceKm,
        });

        // Small 200ms delay between requests to respect OSM rate limits
        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        failed.push({ pincode: pin, reason: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk import completed: ${successful.length} added, ${failed.length} failed.`,
      addedCount: successful.length,
      failedCount: failed.length,
      successful,
      failed,
    });
  } catch (error) {
    console.error("Error in bulkAddPincodes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Bulk add failed.",
    });
  }
}

/**
 * @desc   Get all pincodes with pagination, search, and distance filter
 * @route  GET /api/admin/delivery/pincodes
 * @access Private (Admin only)
 */
export async function getAllPincodes(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      isDeliverable,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { pincode: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { state: { $regex: search, $options: "i" } },
        { district: { $regex: search, $options: "i" } },
      ];
    }

    if (isDeliverable !== undefined && isDeliverable !== "") {
      query.isDeliverable = isDeliverable === "true" || isDeliverable === true;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    const [pincodes, total] = await Promise.all([
      DeliveryPincode.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
      DeliveryPincode.countDocuments(query),
    ]);

    const warehouse = await getPrimaryWarehouse();

    // Attach real-time expected delivery estimates to each pincode
    const enrichedPincodes = pincodes.map((pin) => {
      const estimate = calculateExpectedDelivery(
        pin.distanceFromWarehouseKm || 0,
        warehouse,
        pin.customMinDays,
        pin.customMaxDays
      );
      return {
        ...pin,
        deliveryEstimate: estimate,
      };
    });

    return res.status(200).json({
      success: true,
      data: enrichedPincodes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      warehouse: {
        name: warehouse.name,
        pincode: warehouse.pincode,
        city: warehouse.city,
      },
    });
  } catch (error) {
    console.error("Error in getAllPincodes:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve pincodes.",
    });
  }
}

/**
 * @desc   Get single pincode details with real-time delivery calculation
 * @route  GET /api/admin/delivery/pincode/:pincode
 * @access Private (Admin only)
 */
export async function getPincodeDetails(req, res) {
  try {
    const { pincode } = req.params;
    const cleanPin = String(pincode).trim().toUpperCase();

    const pinDoc = await DeliveryPincode.findOne({ pincode: cleanPin });
    if (!pinDoc) {
      return res.status(404).json({
        success: false,
        message: `Pincode ${cleanPin} not found in database.`,
      });
    }

    const warehouse = await getPrimaryWarehouse();
    const distanceKm = calculateHaversineDistanceKm(
      warehouse.latitude,
      warehouse.longitude,
      pinDoc.latitude,
      pinDoc.longitude
    );

    const deliveryEstimate = calculateExpectedDelivery(
      distanceKm,
      warehouse,
      pinDoc.customMinDays,
      pinDoc.customMaxDays
    );

    return res.status(200).json({
      success: true,
      data: pinDoc,
      warehouse: {
        name: warehouse.name,
        pincode: warehouse.pincode,
        city: warehouse.city,
        latitude: warehouse.latitude,
        longitude: warehouse.longitude,
      },
      deliveryEstimate,
    });
  } catch (error) {
    console.error("Error in getPincodeDetails:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get pincode details.",
    });
  }
}

/**
 * @desc   Update pincode settings or coordinates
 * @route  PATCH /api/admin/delivery/pincode/:pincode
 * @access Private (Admin only)
 */
export async function updatePincode(req, res) {
  try {
    const { pincode } = req.params;
    const cleanPin = String(pincode).trim().toUpperCase();

    const pinDoc = await DeliveryPincode.findOne({ pincode: cleanPin });
    if (!pinDoc) {
      return res.status(404).json({
        success: false,
        message: `Pincode ${cleanPin} not found.`,
      });
    }

    const {
      latitude,
      longitude,
      city,
      state,
      district,
      isDeliverable,
      customMinDays,
      customMaxDays,
      shippingFee,
      notes,
    } = req.body;

    if (latitude !== undefined && latitude !== null && latitude !== "") {
      pinDoc.latitude = parseFloat(latitude);
    }
    if (longitude !== undefined && longitude !== null && longitude !== "") {
      pinDoc.longitude = parseFloat(longitude);
    }
    if (city !== undefined) pinDoc.city = city.trim();
    if (state !== undefined) pinDoc.state = state.trim();
    if (district !== undefined) pinDoc.district = district.trim();
    if (typeof isDeliverable === "boolean") pinDoc.isDeliverable = isDeliverable;
    if (customMinDays !== undefined) pinDoc.customMinDays = customMinDays ? Number(customMinDays) : null;
    if (customMaxDays !== undefined) pinDoc.customMaxDays = customMaxDays ? Number(customMaxDays) : null;
    if (shippingFee !== undefined) pinDoc.shippingFee = Number(shippingFee) || 0;
    if (notes !== undefined) pinDoc.notes = notes;

    const warehouse = await getPrimaryWarehouse();
    const distanceKm = calculateHaversineDistanceKm(
      warehouse.latitude,
      warehouse.longitude,
      pinDoc.latitude,
      pinDoc.longitude
    );
    pinDoc.distanceFromWarehouseKm = distanceKm;

    await pinDoc.save();

    const deliveryEstimate = calculateExpectedDelivery(
      distanceKm,
      warehouse,
      pinDoc.customMinDays,
      pinDoc.customMaxDays
    );

    return res.status(200).json({
      success: true,
      message: `Pincode ${cleanPin} updated successfully.`,
      data: pinDoc,
      deliveryEstimate,
    });
  } catch (error) {
    console.error("Error in updatePincode:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update pincode.",
    });
  }
}

/**
 * @desc   Delete a pincode
 * @route  DELETE /api/admin/delivery/pincode/:pincode
 * @access Private (Admin only)
 */
export async function deletePincode(req, res) {
  try {
    const { pincode } = req.params;
    const cleanPin = String(pincode).trim().toUpperCase();

    const deleted = await DeliveryPincode.findOneAndDelete({ pincode: cleanPin });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Pincode ${cleanPin} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Pincode ${cleanPin} deleted successfully.`,
      pincode: cleanPin,
    });
  } catch (error) {
    console.error("Error in deletePincode:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete pincode.",
    });
  }
}

/**
 * @desc   Get warehouse configuration
 * @route  GET /api/admin/delivery/warehouse
 * @access Private (Admin only)
 */
export async function getWarehouseConfig(req, res) {
  try {
    const warehouse = await getPrimaryWarehouse();
    return res.status(200).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    console.error("Error in getWarehouseConfig:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get warehouse config.",
    });
  }
}

/**
 * @desc   Update warehouse configuration (location, speed tiers, handling days)
 * @route  PUT /api/admin/delivery/warehouse
 * @access Private (Admin only)
 */
export async function updateWarehouseConfig(req, res) {
  try {
    const {
      name,
      pincode,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      handlingDays,
      speedTiers,
      recalculateAllPincodes = true,
    } = req.body;

    let warehouse = await getPrimaryWarehouse();

    if (name) warehouse.name = name.trim();
    if (address) warehouse.address = address.trim();
    if (city) warehouse.city = city.trim();
    if (state) warehouse.state = state.trim();
    if (country) warehouse.country = country.trim();
    if (handlingDays !== undefined) warehouse.handlingDays = Math.max(0, Number(handlingDays));
    if (Array.isArray(speedTiers) && speedTiers.length > 0) warehouse.speedTiers = speedTiers;

    // Check if pincode or coordinates are being updated
    let newLat = latitude !== undefined && latitude !== null && latitude !== "" ? parseFloat(latitude) : null;
    let newLon = longitude !== undefined && longitude !== null && longitude !== "" ? parseFloat(longitude) : null;

    if (pincode && pincode.trim() !== warehouse.pincode) {
      warehouse.pincode = pincode.trim().toUpperCase();

      // If lat/lon not explicitly passed with new pincode, auto-geocode warehouse
      if (newLat === null || isNaN(newLat) || newLon === null || isNaN(newLon)) {
        const geo = await fetchCoordinatesByPincode(warehouse.pincode);
        if (geo.success) {
          warehouse.latitude = geo.latitude;
          warehouse.longitude = geo.longitude;
          if (!city && geo.city) warehouse.city = geo.city;
          if (!state && geo.state) warehouse.state = geo.state;
        }
      }
    }

    if (newLat !== null && !isNaN(newLat)) warehouse.latitude = newLat;
    if (newLon !== null && !isNaN(newLon)) warehouse.longitude = newLon;

    await warehouse.save();

    // Optionally recalculate all stored pincode distances if warehouse position changed
    let updatedCount = 0;
    if (recalculateAllPincodes) {
      const allPincodes = await DeliveryPincode.find({});
      for (const pin of allPincodes) {
        const dist = calculateHaversineDistanceKm(
          warehouse.latitude,
          warehouse.longitude,
          pin.latitude,
          pin.longitude
        );
        pin.distanceFromWarehouseKm = dist;
        await pin.save();
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Warehouse configuration updated successfully.",
      data: warehouse,
      pincodesRecalculated: updatedCount,
    });
  } catch (error) {
    console.error("Error in updateWarehouseConfig:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update warehouse config.",
    });
  }
}
