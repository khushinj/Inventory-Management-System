import express from "express";
import { normalizeDesignNumberAll } from "../middleware/normalizeDesignNumber.js";
import {
  createPurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderStats,
  shipPurchaseOrder,
} from "../controllers/purchaseOrder.controller.js";

const router = express.Router();

// Apply normalization middleware to all routes
router.use(normalizeDesignNumberAll);

// GET /api/purchase-order/stats - Get statistics
router.get("/stats", getPurchaseOrderStats);

// GET /api/purchase-order - Get all purchase orders (with optional filters)
router.get("/", getAllPurchaseOrders);

// GET /api/purchase-order/:id - Get purchase order by ID
router.get("/:id", getPurchaseOrderById);

// POST /api/purchase-order - Create new purchase order
router.post("/", createPurchaseOrder);

// POST /api/purchase-order/:id/ship
router.post("/:id/ship", shipPurchaseOrder);

// PUT /api/purchase-order/:id - Update purchase order by ID
router.put("/:id", updatePurchaseOrder);

// DELETE /api/purchase-order/:id - Delete purchase order by ID
router.delete("/:id", deletePurchaseOrder);

export default router;
