import mongoose from 'mongoose';

const serviceReviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required']
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VendorService'
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ServiceBooking',
            required: [true, 'Booking ID is required']
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot be more than 5']
        }
    },
    {
        timestamps: true
    }
);

export const ServiceReview = mongoose.model('ServiceReview', serviceReviewSchema);
