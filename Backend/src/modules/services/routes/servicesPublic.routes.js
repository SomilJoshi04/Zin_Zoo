import express from 'express';
import { ServiceCategory } from '../models/serviceCategory.model.js';
import { VendorService } from '../models/vendorService.model.js';

const router = express.Router();

router.get('/categories', async (req, res) => {
    try {
        const categories = await ServiceCategory.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: { categories } });
    } catch (error) {
        console.error('Error fetching public categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
});

router.get('/list', async (req, res) => {
    try {
        const query = { isActive: true };
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.subCategory) {
            query.subCategory = req.query.subCategory;
        }
        const services = await VendorService.find(query).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: { services } });
    } catch (error) {
        console.error('Error fetching public services:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch services' });
    }
});

export default router;
