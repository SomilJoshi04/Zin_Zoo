import { FoodAccessoriesBanner } from '../models/accessoriesBanner.model.js';
import { v2 as cloudinary } from 'cloudinary';

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
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'food/accessories-banners', resource_type: 'image' },
                    (error, result) => {
                        if (error) return reject(error);
                        return resolve(result);
                    }
                );
                stream.end(file.buffer);
            });

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

    if (doc.publicId) {
        try {
            await cloudinary.uploader.destroy(doc.publicId);
        } catch {
            // ignore cloudinary deletion errors
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
