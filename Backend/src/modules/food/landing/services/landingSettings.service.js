import { FoodLandingSettings } from '../models/landingSettings.model.js';
import { uploadVideoBuffer, deleteLocalFile } from '../../../../services/localUpload.service.js';

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

    const uploadResultUrl = await uploadVideoBuffer(file.buffer, 'food/landing-videos');

    return {
        videoUrl: uploadResultUrl,
        publicId: uploadResultUrl
    };
};

export const deleteLandingVideoFile = async (publicIdOrUrl) => {
    if (!publicIdOrUrl) return;
    try {
        await deleteLocalFile(publicIdOrUrl);
    } catch (error) {
        // ignore errors
    }
};

