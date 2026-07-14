import { FoodLandingSettings } from '../models/landingSettings.model.js';
import { v2 as cloudinary } from 'cloudinary';

export const getLandingSettings = async () => {
    let doc = await FoodLandingSettings.findOne().lean();
    if (!doc) {
        doc = (await FoodLandingSettings.create({})).toObject();
    }
    return doc;
};

export const updateLandingSettings = async (payload) => {
    const doc = await FoodLandingSettings.findOneAndUpdate({}, payload, {
        new: true,
        upsert: true
    }).lean();
    return doc;
};

export const uploadLandingVideoFile = async (file) => {
    if (!file) {
        throw new Error('No file provided');
    }

    const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'food/landing-videos', resource_type: 'video' },
            (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            }
        );
        stream.end(file.buffer);
    });

    return {
        videoUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id
    };
};

export const deleteLandingVideoFile = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    } catch (error) {
        // ignore errors
    }
};

