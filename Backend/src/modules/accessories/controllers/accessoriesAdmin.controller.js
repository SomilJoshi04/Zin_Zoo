import mongoose from 'mongoose';
import { AccessoriesCategory } from '../models/accessoriesCategory.model.js';
import { AccessoriesProduct } from '../models/accessoriesProduct.model.js';
import { broadcastPublicUpdate } from '../../../config/socket.js';

// ----- Categories -----
export async function getCategories(req, res, next) {
    try {
        const categories = await AccessoriesCategory.find().sort({ sortOrder: 1, createdAt: -1 });
        res.status(200).json({ success: true, message: 'Accessories categories fetched successfully', data: { categories } });
    } catch (error) {
        next(error);
    }
}

export async function createCategory(req, res, next) {
    try {
        const category = await AccessoriesCategory.create(req.body);
        broadcastPublicUpdate('accessories:category:update', { action: 'create', data: category });
        res.status(201).json({ success: true, message: 'Category created successfully', data: { category } });
    } catch (error) {
        next(error);
    }
}

export async function updateCategory(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }
        const category = await AccessoriesCategory.findByIdAndUpdate(id, req.body, { new: true });
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        broadcastPublicUpdate('accessories:category:update', { action: 'update', data: category });
        res.status(200).json({ success: true, message: 'Category updated successfully', data: { category } });
    } catch (error) {
        next(error);
    }
}

export async function deleteCategory(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }
        const category = await AccessoriesCategory.findByIdAndDelete(id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        
        // Also delete related products
        await AccessoriesProduct.deleteMany({ categoryId: id });
        
        broadcastPublicUpdate('accessories:category:update', { action: 'delete', data: { _id: id } });
        res.status(200).json({ success: true, message: 'Category deleted successfully', data: { category } });
    } catch (error) {
        next(error);
    }
}

export async function toggleCategoryStatus(req, res, next) {
    try {
        const { id } = req.params;
        const category = await AccessoriesCategory.findById(id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        
        category.isActive = !category.isActive;
        await category.save();
        
        broadcastPublicUpdate('accessories:category:update', { action: 'update', data: category });
        res.status(200).json({ success: true, message: 'Category status toggled successfully', data: { category } });
    } catch (error) {
        next(error);
    }
}

// ----- Products -----
export async function getProducts(req, res, next) {
    try {
        const { categoryId, search, status } = req.query;
        let query = {};
        if (categoryId) query.categoryId = categoryId;
        if (status) query.isActive = status === 'active';
        if (search) query.name = { $regex: search, $options: 'i' };

        const products = await AccessoriesProduct.find(query)
            .populate('categoryId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, message: 'Accessories products fetched successfully', data: { products } });
    } catch (error) {
        next(error);
    }
}

export async function createProduct(req, res, next) {
    try {
        if (req.body.categoryId) {
            const cat = await AccessoriesCategory.findById(req.body.categoryId);
            if (cat) req.body.categoryName = cat.name;
        }
        const product = await AccessoriesProduct.create(req.body);
        broadcastPublicUpdate('accessories:product:update', { action: 'create', data: product });
        res.status(201).json({ success: true, message: 'Product created successfully', data: { product } });
    } catch (error) {
        next(error);
    }
}

export async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;
        if (req.body.categoryId) {
            const cat = await AccessoriesCategory.findById(req.body.categoryId);
            if (cat) req.body.categoryName = cat.name;
        }
        const product = await AccessoriesProduct.findByIdAndUpdate(id, req.body, { new: true }).populate('categoryId', 'name');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        broadcastPublicUpdate('accessories:product:update', { action: 'update', data: product });
        res.status(200).json({ success: true, message: 'Product updated successfully', data: { product } });
    } catch (error) {
        next(error);
    }
}

export async function deleteProduct(req, res, next) {
    try {
        const { id } = req.params;
        const product = await AccessoriesProduct.findByIdAndDelete(id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        broadcastPublicUpdate('accessories:product:update', { action: 'delete', data: { _id: id } });
        res.status(200).json({ success: true, message: 'Product deleted successfully', data: { product } });
    } catch (error) {
        next(error);
    }
}

export async function toggleProductStatus(req, res, next) {
    try {
        const { id } = req.params;
        const product = await AccessoriesProduct.findById(id).populate('categoryId', 'name');
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        
        product.isActive = !product.isActive;
        await product.save();
        
        broadcastPublicUpdate('accessories:product:update', { action: 'update', data: product });
        res.status(200).json({ success: true, message: 'Product status toggled successfully', data: { product } });
    } catch (error) {
        next(error);
    }
}
