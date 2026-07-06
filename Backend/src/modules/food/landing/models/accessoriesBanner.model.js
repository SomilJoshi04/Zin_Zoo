import mongoose from 'mongoose';

const foodAccessoriesBannerSchema = new mongoose.Schema(
    {
        imageUrl: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        },
        title: {
            type: String
        },
        ctaText: {
            type: String
        },
        ctaLink: {
            type: String
        },
        zoneId: {
            type: String
        },
        sortOrder: {
            type: Number,
            default: 0,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        collection: 'food_accessories_banners',
        timestamps: true
    }
);

foodAccessoriesBannerSchema.index({ isActive: 1, sortOrder: 1 });

export const FoodAccessoriesBanner = mongoose.model('FoodAccessoriesBanner', foodAccessoriesBannerSchema);
