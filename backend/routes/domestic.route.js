import express from "express";
import {
  createDomesticEntry,
  getDomesticEntries,
  updateDomesticEntry
} from "../controllers/domestic.controller.js";

const router = express.Router();

router.post("/", createDomesticEntry);
router.get("/", getDomesticEntries);
router.patch("/:id", updateDomesticEntry);

export default router;
