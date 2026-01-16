import express from "express";
import {
  createExportEntry,
  getExportEntries
} from "../controllers/export.controller.js";

const router = express.Router();

router.post("/", createExportEntry);
router.get("/", getExportEntries);

export default router;
