import express from "express";
import { normalizeDesignNumberAll } from "../middleware/normalizeDesignNumber.js";
import {
  createOnlineEntry,
  getOnlineEntries,
  updateOnlineEntry,
  deleteOnlineEntry
} from "../controllers/online.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";

const router = express.Router();

// Apply normalization middleware to all routes
router.use(normalizeDesignNumberAll);

router.post("/", autoRecalculateInventory, createOnlineEntry);
router.get("/", getOnlineEntries);
router.patch("/:id", autoRecalculateInventory, updateOnlineEntry);
router.delete("/:id", autoRecalculateInventory, deleteOnlineEntry);

export default router;
