import { AdminNotification } from '../../../../core/notifications/models/adminNotification.model.js';
import { getIO } from '../../../../config/socket.js';

export const createAdminNotification = async (payload) => {
    try {
        const notification = await AdminNotification.create(payload);
        
        // Emit socket event to admins
        const io = getIO();
        if (io) {
            io.to('admin-orders').emit('admin_new_order', notification); // keeping backward compatible event name
            io.to('admin-orders').emit('adminNotificationsUpdated', notification);
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating admin notification:', error);
        return null;
    }
};

export const getAdminNotifications = async (query = {}) => {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.isRead !== undefined) {
        filter.isRead = query.isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
        AdminNotification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AdminNotification.countDocuments(filter)
    ]);

    return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    };
};

export const markNotificationAsRead = async (id) => {
    return AdminNotification.findByIdAndUpdate(id, { isRead: true }, { new: true }).lean();
};

export const markAllNotificationsAsRead = async () => {
    return AdminNotification.updateMany({ isRead: false }, { isRead: true });
};

export const clearAllAdminNotifications = async () => {
    return AdminNotification.deleteMany({});
};
