import express from "express";
import {
  createOnlineEntry,
  getOnlineEntries,
  updateOnlineEntry
} from "../controllers/online.controller.js";

const router = express.Router();

router.post("/", createOnlineEntry);
router.get("/", getOnlineEntries);
router.patch("/:id", updateOnlineEntry);

export default router;
