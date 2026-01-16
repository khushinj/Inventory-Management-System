import express from "express";
import {
  createDomesticEntry,
  getDomesticEntries
} from "../controllers/domestic.controller.js";

const router = express.Router();

router.post("/", createDomesticEntry);
router.get("/", getDomesticEntries);

export default router;
