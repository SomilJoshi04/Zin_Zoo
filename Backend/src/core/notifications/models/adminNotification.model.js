import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ['order', 'support', 'feedback', 'general'],
            default: 'general'
        },
        category: {
            type: String,
            enum: ['food', 'grocery', 'accessories', 'support', 'feedback', 'general'],
            default: 'general'
        },
        link: {
            type: String,
            default: '',
            trim: true
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        metaData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    { timestamps: true }
);

// Index for getting recent unread notifications faster
adminNotificationSchema.index({ createdAt: -1 });

export const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
