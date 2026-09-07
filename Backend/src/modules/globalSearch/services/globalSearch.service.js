import mongoose from 'mongoose';
import { FoodItem } from '../../food/admin/models/food.model.js';
import { FoodRestaurant } from '../../food/restaurant/models/restaurant.model.js';
import { GroceryProduct } from '../../food/admin/models/groceryProduct.model.js';
import { AccessoriesProduct } from '../../accessories/models/accessoriesProduct.model.js';
import { VendorService } from '../../services/models/vendorService.model.js';

/**
 * Global Search Service
 * Searches across Food (Restaurants, Items), Grocery, Accessories, and Services concurrently.
 */
export const searchGlobal = async (query = {}) => {
    const { q, limit = 10 } = query;
    const term = String(q || '').trim();
    
    if (!term) {
        return {
            success: true,
            data: {
                results: { food: [], grocery: [], accessories: [], services: [] },
                counts: { food: 0, grocery: 0, accessories: 0, services: 0 },
                total: 0
            }
        };
    }

    // Escape regex special characters to prevent ReDoS or invalid regex errors
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeTerm, 'i');
    
    const limitNum = parseInt(limit, 10) || 10;

    try {
        // 1. Food Search (Restaurants and Items)
        const foodRestaurantPromise = FoodRestaurant.find({
            status: 'approved',
            $or: [
                { restaurantName: { $regex: regex } },
                { cuisines: { $regex: regex } }
            ]
        }).limit(limitNum).lean();

        const foodItemPromise = FoodItem.find({
            name: { $regex: regex }
        }).limit(limitNum).lean();

        // 2. Grocery Search
        const groceryPromise = GroceryProduct.find({
            isActive: true,
            $or: [
                { name: { $regex: regex } },
                { brand: { $regex: regex } }
            ]
        }).limit(limitNum).lean();

        // 3. Accessories Search
        const accessoriesPromise = AccessoriesProduct.find({
            isActive: true,
            $or: [
                { name: { $regex: regex } },
                { brand: { $regex: regex } }
            ]
        }).limit(limitNum).lean();

        // 4. Services Search
        const servicesPromise = VendorService.find({
            isActive: true,
            name: { $regex: regex }
        }).limit(limitNum).lean();

        // Execute all promises concurrently
        const [
            restaurants,
            dishes,
            grocery,
            accessories,
            services
        ] = await Promise.all([
            foodRestaurantPromise,
            foodItemPromise,
            groceryPromise,
            accessoriesPromise,
            servicesPromise
        ]);

        // Process Food Items to attach restaurant info if possible
        let processedDishes = [...dishes];
        if (processedDishes.length > 0) {
            const restaurantIds = [...new Set(processedDishes.map(f => f.restaurantId?.toString()).filter(Boolean))];
            
            if (restaurantIds.length > 0) {
                const rsForFoods = await FoodRestaurant.find({
                    status: 'approved',
                    _id: { $in: restaurantIds.map(id => new mongoose.Types.ObjectId(id)) }
                }).select('restaurantName profileImage image images rating estimatedDeliveryTimeMinutes estimatedDeliveryTime slug').lean();
                
                const restMap = new Map(rsForFoods.map(r => [r._id.toString(), r]));
                
                processedDishes = processedDishes.map(f => {
                    if (!f.restaurantId) return f;
                    const r = restMap.get(f.restaurantId.toString());
                    if (r) {
                        return {
                            ...f,
                            matchType: 'food',
                            restaurantName: r.restaurantName,
                            restaurantImage: r.profileImage || r.image || (Array.isArray(r.images) ? r.images[0] : null),
                            restaurantSlug: r.slug || r._id.toString(),
                            restaurantRating: r.rating,
                            estimatedDeliveryTime: r.estimatedDeliveryTimeMinutes || r.estimatedDeliveryTime
                        };
                    }
                    return f;
                });
            }
        }

        const foodResults = [
            ...restaurants.map(r => ({ ...r, matchType: 'restaurant' })),
            ...processedDishes
        ];

        const responseData = {
            results: {
                food: foodResults,
                grocery,
                accessories,
                services
            },
            counts: {
                food: foodResults.length,
                grocery: grocery.length,
                accessories: accessories.length,
                services: services.length
            },
            total: foodResults.length + grocery.length + accessories.length + services.length
        };

        return {
            success: true,
            data: responseData
        };
    } catch (error) {
        console.error('[GlobalSearchService] Error:', error);
        throw error;
    }
};
