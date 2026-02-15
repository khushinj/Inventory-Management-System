import * as purchaseOrderService from "../services/purchaseOrder.service.js";

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(req, res) {
  try {
    const result = await purchaseOrderService.createPurchaseOrder(req.body);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Controller error creating purchase order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create purchase order",
      error: error.message,
    });
  }
}

/**
 * Get all purchase orders
 */
export async function getAllPurchaseOrders(req, res) {
  try {
    const filters = {
      dealerName: req.query.dealerName,
      buyerName: req.query.buyerName,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await purchaseOrderService.getAllPurchaseOrders(filters);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller error fetching purchase orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase orders",
      error: error.message,
    });
  }
}

/**
 * Get purchase order by ID
 */
export async function getPurchaseOrderById(req, res) {
  try {
    const result = await purchaseOrderService.getPurchaseOrderById(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller error fetching purchase order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase order",
      error: error.message,
    });
  }
}

/**
 * Update purchase order by ID
 */
export async function updatePurchaseOrder(req, res) {
  try {
    const result = await purchaseOrderService.updatePurchaseOrder(
      req.params.id,
      req.body
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller error updating purchase order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update purchase order",
      error: error.message,
    });
  }
}

/**
 * Delete purchase order by ID
 */
export async function deletePurchaseOrder(req, res) {
  try {
    const result = await purchaseOrderService.deletePurchaseOrder(req.params.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller error deleting purchase order:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete purchase order",
      error: error.message,
    });
  }
}

/**
 * Get purchase order statistics
 */
export async function getPurchaseOrderStats(req, res) {
  try {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await purchaseOrderService.getPurchaseOrderStats(filters);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Controller error calculating stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate statistics",
      error: error.message,
    });
  }
}
