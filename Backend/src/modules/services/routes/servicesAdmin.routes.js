import express from 'express';
import * as servicesAdminController from '../controllers/servicesAdmin.controller.js';

const router = express.Router();

router.get('/list', servicesAdminController.getAllServices);
router.post('/add', servicesAdminController.createService);
router.put('/:id', servicesAdminController.updateService);
router.delete('/:id', servicesAdminController.deleteService);

// Categories
router.get('/categories', servicesAdminController.getAllCategories);
router.post('/categories', servicesAdminController.createCategory);
router.put('/categories/:id', servicesAdminController.updateCategory);
router.delete('/categories/:id', servicesAdminController.deleteCategory);

// Bookings
router.get('/bookings', servicesAdminController.getAllBookings);
router.patch('/bookings/:id/status', servicesAdminController.updateBookingStatus);

export default router;
