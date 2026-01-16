import express from "express";
import {
  createOnlineEntry,
  getOnlineEntries
} from "../controllers/online.controller.js";

const router = express.Router();

router.post("/", createOnlineEntry);
router.get("/", getOnlineEntries);

export default router;
