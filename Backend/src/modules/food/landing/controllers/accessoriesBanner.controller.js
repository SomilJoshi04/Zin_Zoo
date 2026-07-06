import {
    listAccessoriesBanners,
    createAccessoriesBannersFromFiles,
    deleteAccessoriesBanner,
    updateAccessoriesBannerOrder,
    toggleAccessoriesBannerStatus
} from '../services/accessoriesBanner.service.js';
import { sendResponse } from '../../../../utils/response.js';
import { ValidationError } from '../../../../core/auth/errors.js';
import { broadcastPublicUpdate } from '../../../../config/socket.js';

export const listAccessoriesBannersController = async (req, res, next) => {
    try {
        const data = await listAccessoriesBanners();
        return sendResponse(res, 200, 'Accessories banners fetched successfully', { banners: data });
    } catch (error) {
        next(error);
    }
};

export const uploadAccessoriesBannersController = async (req, res, next) => {
    try {
        if (!req.files || !req.files.length) {
            throw new ValidationError('No files uploaded');
        }

        const meta = {
            title: req.body.title,
            ctaText: req.body.ctaText,
            ctaLink: req.body.ctaLink,
            zoneId: req.body.zoneId,
        };

        const results = await createAccessoriesBannersFromFiles(req.files, meta);
        broadcastPublicUpdate('banner:update', { action: 'create', section: 'accessories', data: results });
        return sendResponse(res, 201, 'Accessories banners uploaded', { banners: results });
    } catch (error) {
        next(error);
    }
};

export const deleteAccessoriesBannerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Banner id is required');
        }
        const result = await deleteAccessoriesBanner(id);
        broadcastPublicUpdate('banner:update', { action: 'delete', section: 'accessories', data: { _id: id } });
        return sendResponse(res, 200, result.deleted ? 'Accessories banner deleted' : 'Accessories banner not found', result);
    } catch (error) {
        next(error);
    }
};

export const updateAccessoriesBannerOrderController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { order } = req.body;
        const sortOrder = Number(order);
        if (!id || Number.isNaN(sortOrder)) {
            throw new ValidationError('id and numeric order are required');
        }
        const updated = await updateAccessoriesBannerOrder(id, sortOrder);
        broadcastPublicUpdate('banner:update', { action: 'reorder', section: 'accessories', data: updated });
        return sendResponse(res, 200, 'Accessories banner order updated', updated);
    } catch (error) {
        next(error);
    }
};

export const toggleAccessoriesBannerStatusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ValidationError('Banner id is required');
        }
        // Toggle active status
        const banner = await listAccessoriesBanners().then(list => list.find(b => b._id.toString() === id));
        if (!banner) {
            throw new ValidationError('Accessories banner not found');
        }
        const updated = await toggleAccessoriesBannerStatus(id, !banner.isActive);
        broadcastPublicUpdate('banner:update', { action: 'toggle', section: 'accessories', data: updated });
        return sendResponse(res, 200, 'Accessories banner status updated', updated);
    } catch (error) {
        next(error);
    }
};
