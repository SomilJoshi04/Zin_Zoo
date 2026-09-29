import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(config.mongodbUri);
        logger.info(`MongoDB connected: ${conn.connection.host}`);

        // Cleanup duplicate Thali category if both exist: ensure working image on primary Thali and merge foods
        try {
            const Cat = mongoose.connection.collection('food_categories');
            const Foods = mongoose.connection.collection('food_items');
            const thali1 = await Cat.findOne({ _id: new mongoose.Types.ObjectId('6a5bf2a7a43caa0843c47f2b') });
            const thali2 = await Cat.findOne({ _id: new mongoose.Types.ObjectId('6a0fee1331ce84abc893b98e') });
            if (thali1 && thali2) {
                await Foods.updateMany(
                    { categoryId: thali2._id },
                    { $set: { categoryId: thali1._id, categoryName: thali1.name } }
                );
                await Cat.updateOne(
                    { _id: thali1._id },
                    { $set: { image: thali2.image || '/uploads/categories/img_1784021884389_9b229f66.webp' } }
                );
                await Cat.updateOne(
                    { _id: thali2._id },
                    { $set: { isActive: false, status: false } }
                );
            }
        } catch (catErr) {
            logger.warn(`Category cleanup check skipped: ${catErr.message}`);
        }
    } catch (error) {
        logger.error(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Close MongoDB connection (e.g. graceful shutdown).
 * @returns {Promise<void>}
 */
export const disconnectDB = async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
};
