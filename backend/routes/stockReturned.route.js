import express from "express";
import * as StockReturnedController from "../controllers/stockReturned.controller.js";
import { autoRecalculateInventory } from "../middleware/autoRecalculateInventory.js";

const router = express.Router();

router.post("/", autoRecalculateInventory, StockReturnedController.createStockReturned);
router.get("/", StockReturnedController.getAllStockReturned);
router.get("/stats", StockReturnedController.getStockReturnedStats);
router.get("/:id", StockReturnedController.getStockReturnedById);
router.put("/:id", autoRecalculateInventory, StockReturnedController.updateStockReturned);
router.delete("/:id", autoRecalculateInventory, StockReturnedController.deleteStockReturned);

export default router;
