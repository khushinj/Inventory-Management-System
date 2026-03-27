import express from "express";
import {
  getAllProductionTrackingEntries,
  getProductionTrackingEntryById,
  createProductionTrackingEntry,
  updateProductionTrackingEntry,
  deleteProductionTrackingEntry,
} from "../controllers/productionTracking.controller.js";

const router = express.Router();

// Routes
router.get("/", getAllProductionTrackingEntries);
router.get("/:id", getProductionTrackingEntryById);
router.post("/", createProductionTrackingEntry);
router.put("/:id", updateProductionTrackingEntry);
router.delete("/:id", deleteProductionTrackingEntry);

export default router;
