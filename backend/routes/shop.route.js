import express from "express";
import { createShopEntry, getShopEntries } from "../controllers/shop.controller.js";

const router = express.Router();

router.post("/", createShopEntry);
router.get("/", getShopEntries);

export default router;
