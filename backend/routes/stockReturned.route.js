import express from "express";
import * as StockReturnedController from "../controllers/stockReturned.controller.js";

const router = express.Router();

router.post("/", StockReturnedController.createStockReturned);
router.get("/", StockReturnedController.getAllStockReturned);
router.get("/stats", StockReturnedController.getStockReturnedStats);
router.get("/:id", StockReturnedController.getStockReturnedById);
router.put("/:id", StockReturnedController.updateStockReturned);
router.delete("/:id", StockReturnedController.deleteStockReturned);

export default router;
