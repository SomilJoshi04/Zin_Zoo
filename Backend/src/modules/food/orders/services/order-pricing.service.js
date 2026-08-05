import mongoose from 'mongoose';
import { FoodOrder } from '../models/order.model.js';
const FoodRestaurant = mongoose.models.FoodRestaurant || mongoose.model('FoodRestaurant', new mongoose.Schema({}, { strict: false, collection: 'food_restaurants' }));
import { FoodFeeSettings } from '../../admin/models/feeSettings.model.js';
import { FoodOffer } from '../../admin/models/offer.model.js';
import { FoodOfferUsage } from '../../admin/models/offerUsage.model.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { haversineKm } from './order.helpers.js';

export async function calculateOrderPricing(userId, dto) {
  // Resolve deliveryAddress if missing but deliveryAddressId is present
  if ((!dto.deliveryAddress || !dto.deliveryAddress.location) && dto.deliveryAddressId && userId) {
    const { FoodUser } = await import('../../../../core/users/user.model.js');
    const user = await FoodUser.findById(userId).select('addresses').lean();
    if (user && Array.isArray(user.addresses)) {
      const addr = user.addresses.find(a => String(a._id) === String(dto.deliveryAddressId));
      if (addr) {
        dto.deliveryAddress = addr;
      }
    }
  }

  // Fallback to dto.address if deliveryAddress is missing
  if (!dto.deliveryAddress && dto.address) {
    dto.deliveryAddress = dto.address;
  }

  let restaurant = null;
  if (dto.restaurantId) {
    restaurant = await FoodRestaurant.findById(dto.restaurantId)
      .select("status location")
      .lean();
    if (!restaurant) throw new ValidationError("Restaurant not found");
    if (restaurant.status !== "approved")
      throw new ValidationError("Restaurant not available");
  }

  const items = Array.isArray(dto.items) ? dto.items : [];
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
    0,
  );

  const feeDoc = await FoodFeeSettings.findOne().sort({ createdAt: -1 }).lean();
  const feeSettings = feeDoc || {
    deliveryFee: 0,
    deliveryFeeRanges: [],
    freeDeliveryThreshold: null,
    platformFee: 0,
    gstRate: 0,
  };

  const packagingFee = 0;
  const platformFee = Number(feeSettings.platformFee || 0);

  const freeThreshold = Number(feeSettings.freeDeliveryThreshold || 0);
  let deliveryFee = 0;
  let distanceKm = null;
  if (
    Number.isFinite(freeThreshold) &&
    freeThreshold > 0 &&
    subtotal >= freeThreshold
  ) {
    deliveryFee = 0;
  } else {
    const isGroceryOrAccessories = 
      dto.moduleType === 'grocery' || 
      dto.moduleType === 'accessories' ||
      (items.length > 0 && (items[0].moduleType === 'grocery' || items[0].moduleType === 'accessories'));

    let originLat = null;
    let originLng = null;

    if (isGroceryOrAccessories) {
      const { FoodAdmin } = await import('../../../../core/admin/admin.model.js');
      const storeAdmin = await FoodAdmin.findOne({ adminType: 'super_admin' }).lean();
      if (storeAdmin) {
        originLat = storeAdmin.latitude;
        originLng = storeAdmin.longitude;
      }
    } else if (restaurant) {
      if (restaurant.location?.coordinates?.length === 2) {
        originLng = restaurant.location.coordinates[0];
        originLat = restaurant.location.coordinates[1];
      } else {
        originLat = restaurant.location?.latitude;
        originLng = restaurant.location?.longitude;
      }
    }

    let userLat = dto.deliveryAddress?.latitude;
    let userLng = dto.deliveryAddress?.longitude;
    if (userLat === undefined || userLng === undefined || userLat === null || userLng === null) {
      const coords = dto.deliveryAddress?.location?.coordinates || dto.deliveryAddress?.location;
      if (Array.isArray(coords) && coords.length === 2) {
        userLng = coords[0];
        userLat = coords[1];
      }
    }

    if (isGroceryOrAccessories) {
      if (originLat === null || originLng === null || typeof originLat !== 'number' || typeof originLng !== 'number') {
        throw new ValidationError("Store coordinates are not configured by Admin. Cannot calculate delivery fee.");
      }
    } else {
      if (restaurant && (originLat === null || originLng === null || typeof originLat !== 'number' || typeof originLng !== 'number')) {
        throw new ValidationError("Restaurant coordinates are not configured. Cannot calculate delivery fee.");
      }
    }

    if (dto.deliveryAddress || dto.deliveryAddressId) {
      console.log('[DEBUG PRICING]', { userLat, userLng, typeofUserLat: typeof userLat, typeofUserLng: typeof userLng, payloadDeliveryAddress: dto.deliveryAddress });
      if (userLat === null || userLng === null || typeof userLat !== 'number' || typeof userLng !== 'number') {
        throw new ValidationError("Delivery address coordinates are missing. Please select a location on the map.");
      }
    }

    if (
      typeof originLat === 'number' && typeof originLng === 'number' &&
      typeof userLat === 'number' && typeof userLng === 'number'
    ) {
      distanceKm = haversineKm(originLat, originLng, userLat, userLng);
    }

    const ranges = Array.isArray(feeSettings.deliveryFeeRanges)
      ? [...feeSettings.deliveryFeeRanges]
      : [];
    if (ranges.length > 0 && Number.isFinite(distanceKm)) {
      ranges.sort((a, b) => Number(a.min) - Number(b.min));
      let matched = null;
      for (let i = 0; i < ranges.length; i += 1) {
        const r = ranges[i] || {};
        const min = Number(r.min);
        const max = Number(r.max);
        const fee = Number(r.fee);
        if (
          !Number.isFinite(min) ||
          !Number.isFinite(max) ||
          !Number.isFinite(fee)
        ) {
          continue;
        }
        const isLast = i === ranges.length - 1;
        const inRange = isLast
          ? distanceKm >= min && distanceKm <= max
          : distanceKm >= min && distanceKm < max;
        if (inRange) {
          matched = fee;
          break;
        }
      }
      deliveryFee = Number.isFinite(matched)
        ? matched
        : Number(feeSettings.deliveryFee || 0);
    } else {
      deliveryFee = Number(feeSettings.deliveryFee || 0);
    }
  }

  const gstRate = Number(feeSettings.gstRate || 0);
  const tax =
    Number.isFinite(gstRate) && gstRate > 0
      ? Math.round(subtotal * (gstRate / 100))
      : 0;

  let discount = 0;
  let appliedCoupon = null;
  let couponError = null;
  const codeRaw = dto.couponCode
    ? String(dto.couponCode).trim().toUpperCase()
    : "";

  if (codeRaw) {
    const now = new Date();
    const offer = await FoodOffer.findOne({ couponCode: codeRaw }).lean();
    if (offer) {
      const offerEnd = offer.endDate ? new Date(offer.endDate) : null;
      if (offerEnd && offerEnd.getHours() === 0 && offerEnd.getMinutes() === 0) {
        offerEnd.setHours(23, 59, 59, 999);
      }
      const endOk = !offerEnd || now <= offerEnd;
      const startOk = !offer.startDate || now >= new Date(offer.startDate);
      const statusOk = offer.status === "active" && offer.showInCart !== false;
      const selectedRestaurantIds = Array.isArray(offer.restaurantIds) && offer.restaurantIds.length > 0
        ? offer.restaurantIds
        : [offer.restaurantId].filter(Boolean);
      const isFood = !offer.moduleType || offer.moduleType === 'food';
      let scopeOk = true;
      if (isFood) {
        scopeOk =
          offer.restaurantScope !== "selected" ||
          selectedRestaurantIds.some((id) => String(id) === String(dto.restaurantId || ""));
      } else {
        const eligibleItemIds = Array.isArray(offer.itemIds) ? offer.itemIds.map(id => String(id)) : [];
        if (eligibleItemIds.length > 0) {
          scopeOk = items.some(it => eligibleItemIds.includes(String(it.itemId || it.id)));
        } else {
          scopeOk = true;
        }
      }

      let discountableSubtotal = subtotal;
      if (isFood) {
        if (offer.restaurantScope === "selected") {
          const eligibleResIds = selectedRestaurantIds.map(id => String(id));
          const eligibleItems = items.filter(it => it.restaurantId && eligibleResIds.includes(String(it.restaurantId)));
          discountableSubtotal = eligibleItems.reduce(
            (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
            0,
          );
        }
      } else {
        const eligibleItemIds = Array.isArray(offer.itemIds) ? offer.itemIds.map(id => String(id)) : [];
        if (eligibleItemIds.length > 0) {
          const eligibleItems = items.filter(it => eligibleItemIds.includes(String(it.itemId || it.id)));
          discountableSubtotal = eligibleItems.reduce(
            (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
            0,
          );
        }
      }

      const minOk = subtotal >= (Number(offer.minOrderValue) || 0);
      let usageOk = true;
      if (
        Number(offer.usageLimit) > 0 &&
        Number(offer.usedCount || 0) >= Number(offer.usageLimit)
      ) {
        usageOk = false;
      }

      let perUserOk = true;
      if (userId && mongoose.Types.ObjectId.isValid(userId) && Number(offer.perUserLimit) > 0) {
        const usage = await FoodOfferUsage.findOne({
          offerId: offer._id,
          userId: new mongoose.Types.ObjectId(userId),
        }).lean();
        if (usage && Number(usage.count) >= Number(offer.perUserLimit)) {
          perUserOk = false;
        }
      }

      let firstOrderOk = true;
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        if (offer.customerScope === "first-time") {
          const c = await FoodOrder.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
          });
          firstOrderOk = c === 0;
        }
        if (offer.isFirstOrderOnly === true) {
          const c2 = await FoodOrder.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
          });
          if (c2 > 0) firstOrderOk = false;
        }
      }

      const allowed =
        statusOk &&
        startOk &&
        endOk &&
        scopeOk &&
        minOk &&
        usageOk &&
        perUserOk &&
        firstOrderOk;

      console.log("[DEBUG COUPON]", {
        codeRaw,
        statusOk,
        startOk,
        endOk,
        scopeOk,
        minOk,
        usageOk,
        perUserOk,
        firstOrderOk,
        discountableSubtotal,
        dtoRestaurantId: dto.restaurantId,
        selectedRestaurantIds
      });

      if (allowed) {
        if (offer.discountType === "percentage") {
          const raw = discountableSubtotal * (Number(offer.discountValue) / 100);
          const capped = Number(offer.maxDiscount)
            ? Math.min(raw, Number(offer.maxDiscount))
            : raw;
          discount = Math.max(0, Math.min(discountableSubtotal, Math.floor(capped)));
        } else {
          discount = Math.max(
            0,
            Math.min(discountableSubtotal, Math.floor(Number(offer.discountValue) || 0)),
          );
        }
        appliedCoupon = { code: codeRaw, discount };
      } else {
        if (!statusOk) couponError = "Coupon is currently inactive";
        else if (!startOk || !endOk) couponError = "Coupon has expired or is not yet active";
        else if (!scopeOk) couponError = "Coupon is not applicable to the items in your cart";
        else if (!minOk) couponError = `Minimum order value of ₹${offer.minOrderValue} not met`;
        else if (!usageOk) couponError = "Coupon usage limit has been reached";
        else if (!perUserOk) couponError = "You have already reached the usage limit for this coupon";
        else if (!firstOrderOk) couponError = "This coupon is valid for first-time orders only";
        else couponError = "Coupon is not applicable to this order";
      }
    } else {
      couponError = "Invalid or unavailable coupon code";
    }
  }

  const total = Math.max(
    0,
    subtotal + packagingFee + deliveryFee + platformFee + tax - discount,
  );

  return {
    pricing: {
      subtotal,
      tax,
      packagingFee,
      deliveryFee,
      platformFee,
      discount,
      total,
      currency: "INR",
      couponCode: appliedCoupon?.code || codeRaw || null,
      platformGstNumber: feeSettings.gstNumber || null,
      appliedCoupon,
      couponError,
      distanceKm: Number.isFinite(distanceKm) ? Number(distanceKm.toFixed(2)) : null,
      deliveryFeeBreakdown: Number.isFinite(distanceKm) ? {
        source: "distance",
        distanceKm: Number(distanceKm.toFixed(2)),
        deliveryFee,
      } : { source: "default", deliveryFee },
    },
  };
}
