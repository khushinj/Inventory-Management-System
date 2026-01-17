import express from "express";
import {
  createOnlineEntry,
  getOnlineEntries,
  updateOnlineEntry,
  deleteOnlineEntry
} from "../controllers/online.controller.js";

const router = express.Router();

router.post("/", createOnlineEntry);
router.get("/", getOnlineEntries);
router.patch("/:id", updateOnlineEntry);
router.delete("/:id", deleteOnlineEntry);

export default router;
