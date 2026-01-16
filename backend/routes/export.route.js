import express from "express";
import {
  createExportEntry,
  getExportEntries,
  updateExportEntry
} from "../controllers/export.controller.js";

const router = express.Router();

router.post("/", createExportEntry);
router.get("/", getExportEntries);
router.patch("/:id", updateExportEntry);

export default router;
