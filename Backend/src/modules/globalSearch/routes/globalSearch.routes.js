import express from 'express';
import { globalSearchController } from '../controllers/globalSearch.controller.js';

const router = express.Router();

/**
 * Global Search Endpoint
 * GET /api/v1/global-search
 */
router.get('/', globalSearchController);

export default router;
