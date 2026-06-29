import mongoose from 'mongoose';

const serviceCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Category name is required'],
            trim: true,
            unique: true
        },
        image: {
            type: String,
            default: ''
        },
        subCategories: [{
            name: { type: String, trim: true },
            image: { type: String, default: '' }
        }],
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

export const ServiceCategory = mongoose.model('ServiceCategory', serviceCategorySchema);
