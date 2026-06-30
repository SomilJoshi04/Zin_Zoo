import mongoose from 'mongoose';

const accessoriesCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        image: { type: String, trim: true, default: '' },
        zoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodZone', index: true, default: undefined },
        isActive: { type: Boolean, default: true, index: true },
        sortOrder: { type: Number, default: 0, index: true }
    },
    {
        collection: 'accessories_categories',
        timestamps: true
    }
);

export const AccessoriesCategory = mongoose.model('AccessoriesCategory', accessoriesCategorySchema);
