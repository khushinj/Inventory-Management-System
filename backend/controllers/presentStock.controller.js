import PresentStock from "../models/PresentStock.js";
import ProductionTracking from "../models/ProductionTracking.js";

/**
 * Get all present stock entries
 */
export const getAllPresentStockEntries = async (req, res) => {
  try {
    const productionEntries = await ProductionTracking.find({ finishing: { $gt: 0 } }).sort({ createdAt: -1 });
    const productionIds = productionEntries.map((entry) => entry._id);

    const savedStatuses = await PresentStock.find({ productionTrackingId: { $in: productionIds } }).select(
      "productionTrackingId status"
    );

    const statusByProductionId = new Map(
      savedStatuses.map((entry) => [String(entry.productionTrackingId), entry.status])
    );

    const entries = productionEntries.map((entry) => ({
      _id: entry._id,
      duo: entry.designNumber || "",
      color: entry.color,
      size: entry.size,
      stockQty: entry.finishing || 0,
      status: statusByProductionId.get(String(entry._id)) || "Packed",
    }));

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single present stock entry by ID
 */
export const getPresentStockEntryById = async (req, res) => {
  try {
    const productionEntry = await ProductionTracking.findById(req.params.id);
    if (!productionEntry || productionEntry.finishing <= 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const savedStatus = await PresentStock.findOne({ productionTrackingId: productionEntry._id }).select("status");

    const entry = {
      _id: productionEntry._id,
      duo: productionEntry.designNumber || "",
      color: productionEntry.color,
      size: productionEntry.size,
      stockQty: productionEntry.finishing || 0,
      status: savedStatus?.status || "Packed",
    };

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new present stock entry
 */
export const createPresentStockEntry = async (req, res) => {
  return res.status(405).json({
    error: "Present stock entries are derived from production tracking. New entries are not allowed.",
  });
};

/**
 * Update a present stock entry
 */
export const updatePresentStockEntry = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Packed", "Shipped"].includes(status)) {
      return res.status(400).json({ error: "Status must be Packed or Shipped" });
    }

    const productionEntry = await ProductionTracking.findById(req.params.id);
    if (!productionEntry || productionEntry.finishing <= 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    await PresentStock.findOneAndUpdate(
      { productionTrackingId: productionEntry._id },
      {
        productionTrackingId: productionEntry._id,
        duo: productionEntry.designNumber || "",
        color: productionEntry.color,
        size: productionEntry.size,
        status,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    const entry = {
      _id: productionEntry._id,
      duo: productionEntry.designNumber || "",
      color: productionEntry.color,
      size: productionEntry.size,
      stockQty: productionEntry.finishing || 0,
      status,
    };

    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a present stock entry
 */
export const deletePresentStockEntry = async (req, res) => {
  return res.status(405).json({
    error: "Present stock entries are derived from production tracking. Deleting entries is not allowed.",
  });
};

/**
 * Get status counts
 */
export const getStatusCounts = async (req, res) => {
  try {
    const result = {
      "Packed": 0,
      "Shipped": 0,
    };

    const productionEntries = await ProductionTracking.find({ finishing: { $gt: 0 } }).select("_id");
    const productionIds = productionEntries.map((entry) => String(entry._id));

    if (productionIds.length === 0) {
      return res.json(result);
    }

    const savedStatuses = await PresentStock.find({ productionTrackingId: { $in: productionIds } }).select(
      "productionTrackingId status"
    );

    const statusByProductionId = new Map(
      savedStatuses.map((entry) => [String(entry.productionTrackingId), entry.status])
    );

    productionIds.forEach((id) => {
      const status = statusByProductionId.get(id) || "Packed";
      result[status] += 1;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
