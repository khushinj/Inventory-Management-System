import express from "express";
import {
  createExportEntry,
  getExportEntries,
  updateExportEntry,
  deleteExportEntry
} from "../controllers/export.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";

const router = express.Router();

router.post("/", autoRecalculateInventory, createExportEntry);
router.get("/", getExportEntries);
router.patch("/:id", autoRecalculateInventory, updateExportEntry);
router.delete("/:id", autoRecalculateInventory, deleteExportEntry);

export default router;
