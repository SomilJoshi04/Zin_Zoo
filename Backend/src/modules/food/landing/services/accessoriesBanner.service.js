import { FoodAccessoriesBanner } from '../models/accessoriesBanner.model.js';
import { uploadImageBufferDetailed, deleteLocalFile } from '../../../../services/localUpload.service.js';

export const listAccessoriesBanners = async () => {
    return FoodAccessoriesBanner.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
};

export const createAccessoriesBannersFromFiles = async (files, meta = {}) => {
    if (!files || !files.length) {
        return [];
    }

    const results = [];

    for (const file of files) {
        try {
            const uploadResult = await uploadImageBufferDetailed(file.buffer, 'food/accessories-banners');

            const banner = await FoodAccessoriesBanner.create({
                imageUrl: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                title: meta.title,
                ctaText: meta.ctaText,
                ctaLink: meta.ctaLink,
                zoneId: meta.zoneId,
                sortOrder: meta.sortOrder ?? 0,
                isActive: true,
            });

            results.push({ success: true, banner: banner.toObject() });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
    }

    return results;
};

export const deleteAccessoriesBanner = async (id) => {
    const doc = await FoodAccessoriesBanner.findById(id);
    if (!doc) {
        return { deleted: false };
    }

    if (doc.imageUrl) {
        try {
            await deleteLocalFile(doc.imageUrl);
        } catch {
            // ignore deletion errors
        }
    }

    await doc.deleteOne();
    return { deleted: true };
};

export const updateAccessoriesBannerOrder = async (id, sortOrder) => {
    const updated = await FoodAccessoriesBanner.findByIdAndUpdate(
        id,
        { sortOrder },
        { new: true }
    ).lean();
    return updated;
};

export const toggleAccessoriesBannerStatus = async (id, isActive) => {
    const updated = await FoodAccessoriesBanner.findByIdAndUpdate(
        id,
        { isActive },
        { new: true }
    ).lean();
    return updated;
};
