import express from "express";
import { normalizeDesignNumberAll } from "../middleware/normalizeDesignNumber.js";
import {
  createDomesticEntry,
  createDomesticEntriesBulk,
  getDomesticEntries,
  updateDomesticEntry,
  deleteDomesticEntry
} from "../controllers/domestic.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";

const router = express.Router();

// Apply normalization middleware to all routes
router.use(normalizeDesignNumberAll);

router.post("/", autoRecalculateInventory, createDomesticEntry);
router.post("/bulk", autoRecalculateInventory, createDomesticEntriesBulk);
router.get("/", getDomesticEntries);
router.patch("/:id", autoRecalculateInventory, updateDomesticEntry);
router.delete("/:id", autoRecalculateInventory, deleteDomesticEntry);

export default router;
