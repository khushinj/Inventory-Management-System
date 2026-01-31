import express from "express";
import {
  createOnlineEntry,
  getOnlineEntries,
  updateOnlineEntry,
  deleteOnlineEntry
} from "../controllers/online.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";

const router = express.Router();

router.post("/", autoRecalculateInventory, createOnlineEntry);
router.get("/", getOnlineEntries);
router.patch("/:id", autoRecalculateInventory, updateOnlineEntry);
router.delete("/:id", autoRecalculateInventory, deleteOnlineEntry);

export default router;
