import express from "express";
import {
  createExportEntry,
  getExportEntries,
  updateExportEntry,
  deleteExportEntry
} from "../controllers/export.controller.js";

const router = express.Router();

router.post("/", createExportEntry);
router.get("/", getExportEntries);
router.patch("/:id", updateExportEntry);
router.delete("/:id", deleteExportEntry);

export default router;
