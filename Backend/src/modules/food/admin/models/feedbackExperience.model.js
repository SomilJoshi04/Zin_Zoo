import mongoose from 'mongoose';

const feedbackExperienceSchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            refPath: 'userModel'
        },
        userModel: {
            type: String,
            enum: ['FoodUser'],
            default: 'FoodUser'
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            index: true
        },
        restaurantId: { 
            type: mongoose.Schema.Types.ObjectId, 
            index: true 
        },
        rating: { 
            type: Number, 
            required: true,
            min: 1,
            max: 5
        },
        comment: { 
            type: String, 
            trim: true,
            default: ''
        },
        customerName: {
            type: String,
            trim: true,
            default: ''
        },
        customerPhone: {
            type: String,
            trim: true,
            default: ''
        },
        module: { 
            type: String, 
            enum: ['user', 'app', 'order'],
            required: true,
            index: true
        }
    },
    {
        collection: 'food_feedback_experiences',
        timestamps: true
    }
);

feedbackExperienceSchema.index({ module: 1, createdAt: -1 });
feedbackExperienceSchema.index({ userId: 1, createdAt: -1 });

export const FeedbackExperience = mongoose.model('FeedbackExperience', feedbackExperienceSchema);
