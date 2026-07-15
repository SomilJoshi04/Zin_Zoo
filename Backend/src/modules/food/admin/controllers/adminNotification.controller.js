import * as adminNotificationService from '../services/adminNotification.service.js';
import { sendResponse } from '../../../../utils/response.js';

export const getAdminNotificationsController = async (req, res, next) => {
    try {
        const result = await adminNotificationService.getAdminNotifications(req.query);
        return sendResponse(res, 200, 'Admin notifications fetched successfully', result);
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsReadController = async (req, res, next) => {
    try {
        const notification = await adminNotificationService.markNotificationAsRead(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        return sendResponse(res, 200, 'Notification marked as read', notification);
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsAsReadController = async (req, res, next) => {
    try {
        await adminNotificationService.markAllNotificationsAsRead();
        return sendResponse(res, 200, 'All notifications marked as read', null);
    } catch (error) {
        next(error);
    }
};

export const clearAllNotificationsController = async (req, res, next) => {
    try {
        await adminNotificationService.clearAllAdminNotifications();
        return sendResponse(res, 200, 'All notifications cleared', null);
    } catch (error) {
        next(error);
    }
};
