import * as bannerService from '../services/homePromotionBanner.service.js';
import { broadcastPublicUpdate } from '../../../../config/socket.js';

export const listHomePromotionBannersController = async (req, res, next) => {
    try {
        const banners = await bannerService.listHomePromotionBanners();
        res.status(200).json({ success: true, banners });
    } catch (error) {
        next(error);
    }
};

export const createHomePromotionBannerController = async (req, res, next) => {
    try {
        const file = req.file;
        const meta = req.body;
        const banner = await bannerService.createHomePromotionBanner(file, meta);
        broadcastPublicUpdate('banner:update', { action: 'create', section: 'home-promotion', data: banner });
        res.status(201).json({ success: true, banner });
    } catch (error) {
        next(error);
    }
};

export const updateHomePromotionBannerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const banner = await bannerService.updateHomePromotionBanner(id, data);
        broadcastPublicUpdate('banner:update', { action: 'update', section: 'home-promotion', data: banner });
        res.status(200).json({ success: true, banner });
    } catch (error) {
        next(error);
    }
};

export const deleteHomePromotionBannerController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await bannerService.deleteHomePromotionBanner(id);
        broadcastPublicUpdate('banner:update', { action: 'delete', section: 'home-promotion', data: { _id: id } });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

export const toggleHomePromotionBannerStatusController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const banner = await bannerService.toggleHomePromotionBannerStatus(id, isActive);
        broadcastPublicUpdate('banner:update', { action: 'toggle', section: 'home-promotion', data: banner });
        res.status(200).json({ success: true, banner });
    } catch (error) {
        next(error);
    }
};

export const updateHomePromotionBannerOrderController = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { sortOrder } = req.body;
        const banner = await bannerService.updateHomePromotionBannerOrder(id, sortOrder);
        res.status(200).json({ success: true, banner });
    } catch (error) {
        next(error);
    }
};
