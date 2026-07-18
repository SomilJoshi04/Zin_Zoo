import mongoose from 'mongoose';

const accessoriesProductSchema = new mongoose.Schema(
    {
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'AccessoriesCategory', index: true },
        categoryName: { type: String, trim: true, default: '' },
        name: { type: String, required: true, trim: true, index: true },
        description: { type: String, trim: true, default: '' },
        price: { type: Number, required: true, min: 0 },
        unit: { type: String, trim: true, default: '1 pc' },
        stock: { type: Number, default: 0, min: 0, index: true },
        image: { type: String, trim: true, default: '' },
        isActive: { type: Boolean, default: true, index: true },
        isRecommended: { type: Boolean, default: false, index: true },
        zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodZone', index: true, default: undefined },
        quantity: { type: Number, default: 0 }
    },
    {
        collection: 'accessories_products',
        timestamps: true
    }
);

export const AccessoriesProduct = mongoose.model('AccessoriesProduct', accessoriesProductSchema);
