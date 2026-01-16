import express from "express";
import { createShopEntry, getShopEntries, updateShopEntry } from "../controllers/shop.controller.js";

const router = express.Router();

router.post("/", createShopEntry);
router.get("/", getShopEntries);
router.patch("/:id", updateShopEntry);

export default router;
