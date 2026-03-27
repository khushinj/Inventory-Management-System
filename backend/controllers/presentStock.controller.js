import PresentStock from "../models/PresentStock.js";

/**
 * Get all present stock entries
 */
export const getAllPresentStockEntries = async (req, res) => {
  try {
    const entries = await PresentStock.find().sort({ createdAt: -1 });
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
    const entry = await PresentStock.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new present stock entry
 */
export const createPresentStockEntry = async (req, res) => {
  try {
    const { duo, color, size, status } = req.body;

    if (!duo || !color || !size) {
      return res.status(400).json({ error: "DUO, Color, and Size are required" });
    }

    const entry = new PresentStock({
      duo: duo.trim(),
      color: color.trim(),
      size: size.trim(),
      status: status || "In Cutting",
    });

    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update a present stock entry
 */
export const updatePresentStockEntry = async (req, res) => {
  try {
    const { duo, color, size, status } = req.body;

    const updateData = {};
    if (duo !== undefined) updateData.duo = duo.trim();
    if (color !== undefined) updateData.color = color.trim();
    if (size !== undefined) updateData.size = size.trim();
    if (status !== undefined) updateData.status = status;

    const entry = await PresentStock.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a present stock entry
 */
export const deletePresentStockEntry = async (req, res) => {
  try {
    const entry = await PresentStock.findByIdAndDelete(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get status counts
 */
export const getStatusCounts = async (req, res) => {
  try {
    const counts = await PresentStock.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      "In Cutting": 0,
      "In Stitching": 0,
      "In Finishing": 0,
      "Packed": 0,
      "Shipped": 0,
    };

    counts.forEach((item) => {
      if (result.hasOwnProperty(item._id)) {
        result[item._id] = item.count;
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
