import express from "express";
import {
  getAllShippedOrders,
  getShippedOrderById,
  createShippedOrder,
  updateShippedOrder,
  deleteShippedOrder,
} from "../controllers/shippedOrder.controller.js";

const router = express.Router();

router.get("/", getAllShippedOrders);
router.get("/:id", getShippedOrderById);
router.post("/", createShippedOrder);
router.put("/:id", updateShippedOrder);
router.delete("/:id", deleteShippedOrder);

export default router;
