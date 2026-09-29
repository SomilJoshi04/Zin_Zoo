import { searchUnified, getAdminCategories } from '../services/search.service.js';
import { sendResponse, sendError } from '../../../../utils/response.js';

/**
 * Unified Search for Restaurants, Food Items, and Cuisines
 */
export const searchController = async (req, res, next) => {
    try {
        const { q, lat, lng, radiusKm, categoryId, minRating, maxDeliveryTime, isVeg, page, limit, zoneId } = req.query;
        console.log(`[Search-Debug] q="${q}", catId="${categoryId}", zone="${zoneId}", coords=[${lat}, ${lng}]`);

        const results = await searchUnified({
            q,
            lat,
            lng,
            radiusKm,
            categoryId,
            minRating,
            maxDeliveryTime,
            isVeg,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            zoneId
        });

        return sendResponse(res, 200, 'Search results fetched successfully', results.data);
    } catch (error) {
        next(error);
    }
};

export const listAdminCategoriesController = async (req, res, next) => {
    try {
        const { zoneId } = req.query;
        const categories = await getAdminCategories({ zoneId });
        
        return sendResponse(res, 200, 'Admin categories fetched successfully', { categories });
    } catch (error) {
        next(error);
    }
};

import mongoose from 'mongoose';
import { FoodItem } from '../../admin/models/food.model.js';
import { FoodCategory } from '../../admin/models/category.model.js';
import { FoodRestaurant } from '../../restaurant/models/restaurant.model.js';

export const listPublicFoodsController = async (req, res, next) => {
    try {
        const { categoryId, category, search, isVeg, zoneId, page = 1, limit = 100 } = req.query;
        const filter = { isAvailable: { $ne: false }, approvalStatus: { $ne: 'rejected' } };

        // Handle zoneId if provided (filter by restaurants belonging to this zone or global restaurants)
        if (zoneId && mongoose.Types.ObjectId.isValid(String(zoneId).trim())) {
            const zoneObjId = new mongoose.Types.ObjectId(String(zoneId).trim());
            const zoneRestaurants = await FoodRestaurant.find({
                $or: [
                    { zoneId: zoneObjId },
                    { zoneId: null },
                    { zoneId: { $exists: false } }
                ]
            }).select('_id').lean();
            const allowedRestIds = zoneRestaurants.map(r => r._id);
            filter.restaurantId = { $in: allowedRestIds };
        }

        // Handle categoryId (single id, comma-separated ids, or array)
        const catIds = [];
        if (categoryId) {
            const rawIds = Array.isArray(categoryId) ? categoryId : String(categoryId).split(',');
            rawIds.forEach(id => {
                const trimmed = String(id || '').trim();
                if (trimmed && mongoose.Types.ObjectId.isValid(trimmed)) {
                    catIds.push(new mongoose.Types.ObjectId(trimmed));
                }
            });
        }

        // Handle category name/slug (e.g. "thali", "burger")
        if (category) {
            const catTerm = String(category).trim().replace(/-/g, ' ');
            if (catTerm && catTerm !== 'all') {
                const matchingCats = await FoodCategory.find({
                    $or: [
                        { name: { $regex: new RegExp(`^${catTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
                        { slug: String(category).trim().toLowerCase() }
                    ]
                }).select('_id').lean();
                matchingCats.forEach(c => catIds.push(c._id));
            }
        }

        if (catIds.length > 0) {
            filter.categoryId = { $in: catIds };
        } else if (category && String(category).trim().toLowerCase() !== 'all') {
            // Fallback matching by categoryName field
            const catTerm = String(category).trim().replace(/-/g, ' ');
            filter.categoryName = { $regex: new RegExp(catTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
        }

        if (isVeg === 'true') {
            filter.foodType = 'Veg';
        }

        if (search) {
            const term = String(search).trim();
            if (term) {
                filter.name = { $regex: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') };
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = parseInt(limit);

        const [foods, total] = await Promise.all([
            FoodItem.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            FoodItem.countDocuments(filter)
        ]);

        // Populate restaurant info for each food item
        const restaurantIds = Array.from(new Set(foods.map(f => f.restaurantId).filter(Boolean)));
        const restaurants = restaurantIds.length
            ? await FoodRestaurant.find({ _id: { $in: restaurantIds } })
                .select('restaurantName slug rating avgRating estimatedDeliveryTime estimatedDeliveryTimeMinutes profileImage coverImage coverImages isActive isAcceptingOrders outletTimings openDays zoneId')
                .lean()
            : [];
        const restaurantMap = new Map(restaurants.map(r => [String(r._id), r]));

        const formattedFoods = foods.map(f => {
            const rest = f.restaurantId ? restaurantMap.get(String(f.restaurantId)) : null;
            const restaurantSlug = rest?.slug || (rest?.restaurantName ? rest.restaurantName.toLowerCase().replace(/\s+/g, '-') : '');
            return {
                _id: f._id,
                id: f._id,
                itemId: String(f._id),
                restaurantId: f.restaurantId ? String(f.restaurantId) : null,
                restaurantName: rest?.restaurantName || 'Restaurant',
                restaurantSlug,
                restaurant: rest ? {
                    id: String(rest._id),
                    _id: String(rest._id),
                    name: rest.restaurantName,
                    slug: restaurantSlug,
                    rating: Number(rest.rating || rest.avgRating || 0) || 4.5,
                    deliveryTime: rest.estimatedDeliveryTime || (rest.estimatedDeliveryTimeMinutes ? `${rest.estimatedDeliveryTimeMinutes} mins` : '25-30 mins'),
                    isActive: rest.isActive,
                    isAcceptingOrders: rest.isAcceptingOrders,
                    zoneId: rest.zoneId ? String(rest.zoneId) : null,
                } : null,
                categoryId: f.categoryId ? String(f.categoryId) : null,
                categoryName: f.categoryName || '',
                name: f.name,
                description: f.description || '',
                price: Number(f.price || 0),
                originalPrice: Number(f.price || 0),
                image: f.image || '',
                foodType: f.foodType || 'Non-Veg',
                isAvailable: f.isAvailable !== false,
                approvalStatus: f.approvalStatus || 'approved',
                preparationTime: f.preparationTime || '',
                quantity: f.quantity || 0,
                variants: f.variants || []
            };
        });

        return sendResponse(res, 200, 'Public foods fetched successfully', {
            foods: formattedFoods,
            total,
            page: parseInt(page),
            limit: limitNum
        });
    } catch (error) {
        next(error);
    }
};
