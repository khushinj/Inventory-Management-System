import express from "express";
import {
  createDomesticEntry,
  getDomesticEntries,
  updateDomesticEntry,
  deleteDomesticEntry
} from "../controllers/domestic.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";

const router = express.Router();

router.post("/", autoRecalculateInventory, createDomesticEntry);
router.get("/", getDomesticEntries);
router.patch("/:id", autoRecalculateInventory, updateDomesticEntry);
router.delete("/:id", autoRecalculateInventory, deleteDomesticEntry);

export default router;
