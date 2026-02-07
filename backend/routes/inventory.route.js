import express from "express";
import {
  calculateWarehouseInventory,
  getWarehouseInventorySummary,
  getDesignInventoryComparison,
  getLowStockItems,
  getOutOfStockItems,
  getInventoryTrends,
  compareAllWarehouses,
} from "../services/warehouseInventory.service.js";

const router = express.Router();

/**
 * GET /api/inventory/warehouse/:type
 * Get full inventory for a warehouse (domestic, export, online)
 */
router.get("/warehouse/:type", async (req, res) => {
  try {
    const { type } = req.params;
    if (!["domestic", "export", "online"].includes(type)) {
      return res.status(400).json({ error: "Invalid warehouse type" });
    }

    const inventory = await calculateWarehouseInventory(type);
    res.json({
      warehouseType: type,
      itemsCount: Object.keys(inventory).length,
      items: Object.values(inventory),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/warehouse/:type/summary
 * Get inventory summary for a warehouse
 */
router.get("/warehouse/:type/summary", async (req, res) => {
  try {
    const { type } = req.params;
    if (!["domestic", "export", "online"].includes(type)) {
      return res.status(400).json({ error: "Invalid warehouse type" });
    }

    const summary = await getWarehouseInventorySummary(type);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/design/:dno
 * Get inventory comparison for a design across all warehouses
 */
router.get("/design/:dno", async (req, res) => {
  try {
    const { dno } = req.params;
    const comparison = await getDesignInventoryComparison(dno);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/warehouse/:type/low-stock?threshold=10
 * Get low stock items for a warehouse
 */
router.get("/warehouse/:type/low-stock", async (req, res) => {
  try {
    const { type } = req.params;
    const { threshold = 10 } = req.query;

    if (!["domestic", "export", "online"].includes(type)) {
      return res.status(400).json({ error: "Invalid warehouse type" });
    }

    const lowStockItems = await getLowStockItems(type, parseInt(threshold));
    res.json(lowStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/warehouse/:type/out-of-stock
 * Get out of stock items for a warehouse
 */
router.get("/warehouse/:type/out-of-stock", async (req, res) => {
  try {
    const { type } = req.params;
    if (!["domestic", "export", "online"].includes(type)) {
      return res.status(400).json({ error: "Invalid warehouse type" });
    }

    const outOfStockItems = await getOutOfStockItems(type);
    res.json(outOfStockItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/warehouse/:type/trends?days=30
 * Get inventory trends over time
 */
router.get("/warehouse/:type/trends", async (req, res) => {
  try {
    const { type } = req.params;
    const { days = 30 } = req.query;

    if (!["domestic", "export", "online"].includes(type)) {
      return res.status(400).json({ error: "Invalid warehouse type" });
    }

    const trends = await getInventoryTrends(type, parseInt(days));
    res.json(trends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/inventory/compare-all
 * Compare inventory across all warehouses
 */
router.get("/compare-all", async (req, res) => {
  try {
    const comparison = await compareAllWarehouses();
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
