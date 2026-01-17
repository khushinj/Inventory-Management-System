import express from "express";
import {
  createDomesticEntry,
  getDomesticEntries,
  updateDomesticEntry,
  deleteDomesticEntry
} from "../controllers/domestic.controller.js";

const router = express.Router();

router.post("/", createDomesticEntry);
router.get("/", getDomesticEntries);
router.patch("/:id", updateDomesticEntry);
router.delete("/:id", deleteDomesticEntry);

export default router;
