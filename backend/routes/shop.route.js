import express from "express";
import { createShopEntry, getShopEntries, updateShopEntry, deleteShopEntry } from "../controllers/shop.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";

const router = express.Router();

// Apply auto-recalculate middleware to all write operations
router.post("/", autoRecalculateInventory, createShopEntry);
router.get("/", getShopEntries);
router.patch("/:id", autoRecalculateInventory, updateShopEntry);
router.delete("/:id", autoRecalculateInventory, deleteShopEntry);

export default router;
