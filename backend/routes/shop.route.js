import express from "express";
import { createShopEntry, createShopEntriesBulk, getShopEntries, updateShopEntry, deleteShopEntry } from "../controllers/shop.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";
import { normalizeDesignNumberAll } from "../middleware/normalizeDesignNumber.js";

const router = express.Router();

// Apply normalization middleware to all routes
router.use(normalizeDesignNumberAll);

// Apply auto-recalculate middleware to all write operations
router.post("/", autoRecalculateInventory, createShopEntry);
router.post("/bulk", autoRecalculateInventory, createShopEntriesBulk);
router.get("/", getShopEntries);
router.patch("/:id", autoRecalculateInventory, updateShopEntry);
router.delete("/:id", autoRecalculateInventory, deleteShopEntry);

export default router;
