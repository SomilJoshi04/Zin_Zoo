import express from 'express';
import * as adminController from '../controllers/accessoriesAdmin.controller.js';
import * as orderController from '../../food/orders/controllers/order.controller.js';

const router = express.Router();

// Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);
router.patch('/categories/:id/status', adminController.toggleCategoryStatus);

// Products
router.get('/products', adminController.getProducts);
router.post('/products', adminController.createProduct);
router.delete('/products/bulk', adminController.bulkDeleteProducts);
router.put('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);
router.patch('/products/:id/status', adminController.toggleProductStatus);

// Orders
router.get('/orders', adminController.getOrders);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.delete('/orders/:id', orderController.deleteOrderAdminController);
router.delete('/orders/:orderId', orderController.deleteOrderAdminController);

export default router;
