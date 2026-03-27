import express from "express";
import {
  getAllPresentStockEntries,
  getPresentStockEntryById,
  createPresentStockEntry,
  updatePresentStockEntry,
  deletePresentStockEntry,
  getStatusCounts,
} from "../controllers/presentStock.controller.js";

const router = express.Router();

// Get all present stock entries
router.get("/", getAllPresentStockEntries);

// Get status counts summary
router.get("/counts", getStatusCounts);

// Get a single entry by ID
router.get("/:id", getPresentStockEntryById);

// Create a new entry
router.post("/", createPresentStockEntry);

// Update an entry
router.put("/:id", updatePresentStockEntry);

// Delete an entry
router.delete("/:id", deletePresentStockEntry);

export default router;
