import * as groceryAdminService from '../services/groceryAdmin.service.js';
import mongoose from 'mongoose';
import { broadcastPublicUpdate } from '../../../../config/socket.js';

// ----- Categories -----
export async function getCategories(req, res, next) {
    try {
        const categories = await groceryAdminService.getGroceryCategories(req.query || {});
        res.status(200).json({ success: true, message: 'Grocery categories fetched successfully', data: { categories } });
    } catch (error) {
        next(error);
    }
}

export async function createCategory(req, res, next) {
    try {
        const category = await groceryAdminService.createGroceryCategory(req.body);
        broadcastPublicUpdate('grocery:category:update', { action: 'create', data: category });
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
        const category = await groceryAdminService.updateGroceryCategory(id, req.body);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        broadcastPublicUpdate('grocery:category:update', { action: 'update', data: category });
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
        const category = await groceryAdminService.deleteGroceryCategory(id);
        if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
        broadcastPublicUpdate('grocery:category:update', { action: 'delete', data: { _id: id } });
        res.status(200).json({ success: true, message: 'Category deleted successfully', data: { category } });
    } catch (error) {
        next(error);
    }
}

// ----- Products -----
export async function getProducts(req, res, next) {
    try {
        const result = await groceryAdminService.getGroceryProducts(req.query || {});
        res.status(200).json({ success: true, message: 'Grocery products fetched successfully', data: result });
    } catch (error) {
        next(error);
    }
}

export async function createProduct(req, res, next) {
    try {
        const product = await groceryAdminService.createGroceryProduct(req.body);
        broadcastPublicUpdate('grocery:product:update', { action: 'create', data: product });
        res.status(201).json({ success: true, message: 'Product created successfully', data: { product } });
    } catch (error) {
        next(error);
    }
}

export async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        const product = await groceryAdminService.updateGroceryProduct(id, req.body);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        broadcastPublicUpdate('grocery:product:update', { action: 'update', data: product });
        res.status(200).json({ success: true, message: 'Product updated successfully', data: { product } });
    } catch (error) {
        next(error);
    }
}

export async function deleteProduct(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }
        const product = await groceryAdminService.deleteGroceryProduct(id);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        broadcastPublicUpdate('grocery:product:update', { action: 'delete', data: { _id: id } });
        res.status(200).json({ success: true, message: 'Product deleted successfully', data: { product } });
    } catch (error) {
        next(error);
    }
}

// ----- Orders -----
export async function getOrders(req, res, next) {
    try {
        const result = await groceryAdminService.getGroceryOrders(req.query || {});
        res.status(200).json({ success: true, message: 'Grocery orders fetched successfully', data: result });
    } catch (error) {
        next(error);
    }
}

export async function getOrderById(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }
        const order = await groceryAdminService.getGroceryOrderById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.status(200).json({ success: true, message: 'Order fetched successfully', data: { order } });
    } catch (error) {
        next(error);
    }
}

export async function updateOrderStatus(req, res, next) {
    try {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid order ID' });
        }
        const status = req.body?.status;
        if (!status) {
             return res.status(400).json({ success: false, message: 'Status is required' });
        }
        const order = await groceryAdminService.updateGroceryOrderStatus(id, status);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.status(200).json({ success: true, message: 'Order status updated successfully', data: { order } });
    } catch (error) {
        next(error);
    }
}

// ----- Seed Dummy Data -----
export async function seedGroceryData(req, res, next) {
    try {
        const { GroceryCategory } = await import('../models/groceryCategory.model.js');
        const { GroceryProduct } = await import('../models/groceryProduct.model.js');

        // Clear existing for a clean state
        await GroceryCategory.deleteMany({});
        await GroceryProduct.deleteMany({});
        
        // Insert Categories
        const categories = await GroceryCategory.insertMany([
            { name: 'Fresh Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500', isActive: true, sortOrder: 1 },
            { name: 'Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500', isActive: true, sortOrder: 2 },
            { name: 'Dairy & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500', isActive: true, sortOrder: 3 },
            { name: 'Beverages', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500', isActive: true, sortOrder: 4 }
        ]);

        const fruitCatId = categories.find(c => c.name === 'Fresh Fruits')._id;
        const vegCatId = categories.find(c => c.name === 'Vegetables')._id;
        const dairyCatId = categories.find(c => c.name === 'Dairy & Eggs')._id;

        // Insert Products
        await GroceryProduct.insertMany([
            { categoryId: fruitCatId, categoryName: 'Fresh Fruits', name: 'Organic Apples', description: 'Fresh sweet apples', price: 120, unit: '1 kg', stock: 50, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6faa6?w=500', isActive: true, isRecommended: true },
            { categoryId: fruitCatId, categoryName: 'Fresh Fruits', name: 'Bananas', description: 'Yellow ripe bananas', price: 60, unit: '1 dozen', stock: 100, image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500', isActive: true, isRecommended: false },
            { categoryId: vegCatId, categoryName: 'Vegetables', name: 'Tomatoes', description: 'Red juicy tomatoes', price: 40, unit: '1 kg', stock: 200, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500', isActive: true, isRecommended: true },
            { categoryId: vegCatId, categoryName: 'Vegetables', name: 'Onions', description: 'Fresh onions', price: 30, unit: '1 kg', stock: 300, image: 'https://images.unsplash.com/photo-1506807204940-d9d26bc1c277?w=500', isActive: true, isRecommended: false },
            { categoryId: dairyCatId, categoryName: 'Dairy & Eggs', name: 'Cow Milk', description: 'Fresh farm milk', price: 55, unit: '1 Litre', stock: 40, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500', isActive: true, isRecommended: true }
        ]);

        res.status(200).json({ success: true, message: 'Dummy grocery data seeded successfully!' });
    } catch (error) {
        next(error);
    }
}
