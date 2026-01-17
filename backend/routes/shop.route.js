import express from "express";
import { createShopEntry, getShopEntries, updateShopEntry, deleteShopEntry } from "../controllers/shop.controller.js";

const router = express.Router();

router.post("/", createShopEntry);
router.get("/", getShopEntries);
router.patch("/:id", updateShopEntry);
router.delete("/:id", deleteShopEntry);

export default router;
