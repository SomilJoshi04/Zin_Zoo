import mongoose from 'mongoose';

const foodVariantSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 }
    },
    { _id: true }
);

const foodSchema = new mongoose.Schema(
    {
       
        restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodRestaurant', index: true, required: false },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodCategory', index: true },
        categoryName: { type: String, trim: true, default: '' },
        zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodZone', index: true, default: undefined },
        name: { type: String, required: true, trim: true, index: true },
        description: { type: String, trim: true, default: '' },
        price: { type: Number, required: true, min: 0 },
        variants: { type: [foodVariantSchema], default: [] },
        image: { type: String, trim: true, default: '' },
        foodType: { type: String, enum: ['Veg', 'Non-Veg'], default: 'Non-Veg' },
        isAvailable: { type: Boolean, default: true, index: true },
        isRecommended: { type: Boolean, default: false, index: true },
        preparationTime: { type: String, trim: true, default: '' },
       
    },
    {
        collection: 'food_items',
        timestamps: true
    }
);



export const FoodItem = mongoose.model('FoodItem', foodSchema);
