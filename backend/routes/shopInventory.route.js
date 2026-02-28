import express from 'express';
import { normalizeDesignNumberAll } from '../middleware/normalizeDesignNumber.js';
import shopInventoryController from '../controllers/shopInventory.controller.js';

const router = express.Router();

// Apply normalization middleware to all routes
router.use(normalizeDesignNumberAll);

// Calculate/recalculate shop inventory from import, return, and sales data
router.post('/calculate', shopInventoryController.calculateInventory);

// Get shop inventory with optional filters
router.get('/', shopInventoryController.getInventory);

// Get inventory grouped by design number
router.get('/grouped/:designNumber', shopInventoryController.getInventoryGrouped);

export default router;
