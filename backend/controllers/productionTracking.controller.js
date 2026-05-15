import ProductionTracking from "../models/ProductionTracking.js";
import { normalizeSize } from "../utils/normalization.js";

const SAMPLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

const createEmptySizes = () =>
  SAMPLE_SIZES.reduce((accumulator, size) => {
    accumulator[size] = 0;
    return accumulator;
  }, {});

const normalizeProductionSizes = (sizesInput, legacySize = "") => {
  const normalizedSizes = createEmptySizes();

  if (sizesInput && typeof sizesInput === "object") {
    for (const [rawSize, quantity] of Object.entries(sizesInput)) {
      const normalizedSize = normalizeSize(rawSize);
      if (SAMPLE_SIZES.includes(normalizedSize)) {
        normalizedSizes[normalizedSize] = Number(quantity) || 0;
      }
    }

    return normalizedSizes;
  }

  const normalizedLegacySize = normalizeSize(legacySize);
  if (normalizedLegacySize && SAMPLE_SIZES.includes(normalizedLegacySize)) {
    normalizedSizes[normalizedLegacySize] = 1;
  }

  return normalizedSizes;
};

const summarizeSizes = (sizes = {}) =>
  SAMPLE_SIZES.filter((size) => Number(sizes[size]) > 0).join(", ");

// Get all production tracking entries
export const getAllProductionTrackingEntries = async (req, res) => {
  try {
    const entries = await ProductionTracking.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    console.error("Error fetching production tracking entries:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch production tracking entries",
      });
  }
};

// Get single production tracking entry
export const getProductionTrackingEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await ProductionTracking.findById(id);

    if (!entry) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Production tracking entry not found",
        });
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error("Error fetching production tracking entry:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch production tracking entry",
      });
  }
};

// Create production tracking entry
export const createProductionTrackingEntry = async (req, res) => {
  try {
    const {
      designNumber,
      color,
      size,
      sizes,
      cutting,
      cuttingDate,
      stitching,
      stitchingDate,
      finishing,
      finishingDate,
      remarks,
    } = req.body;
    const today = new Date().toISOString();

    const normalizedSizes = normalizeProductionSizes(sizes, size);
    const sizeSummary = summarizeSizes(normalizedSizes);

    if (!color || Object.values(normalizedSizes).every((qty) => Number(qty) <= 0)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Color and at least one size are required fields",
        });
    }

    const newEntry = new ProductionTracking({
      designNumber: designNumber ? designNumber.trim() : "",
      color: color.trim(),
      size: sizeSummary,
      sizes: normalizedSizes,
      cutting: cutting || 0,
      cuttingDate: cuttingDate || today,
      stitching: stitching || 0,
      stitchingDate: stitchingDate || today,
      finishing: finishing || 0,
      finishingDate: finishingDate || today,
      remarks: remarks ? remarks.trim() : "",
    });

    const savedEntry = await newEntry.save();
    res.status(201).json({ success: true, data: savedEntry });
  } catch (error) {
    console.error("Error creating production tracking entry:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create production tracking entry",
      });
  }
};

// Update production tracking entry
export const updateProductionTrackingEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      designNumber,
      color,
      size,
      sizes,
      cutting,
      cuttingDate,
      stitching,
      stitchingDate,
      finishing,
      finishingDate,
      remarks,
    } = req.body;

    const updateData = {};
    if (designNumber !== undefined) updateData.designNumber = designNumber.trim();
    if (color !== undefined) updateData.color = color.trim();
    if (sizes !== undefined || size !== undefined) {
      const normalizedSizes = normalizeProductionSizes(sizes, size);
      updateData.sizes = normalizedSizes;
      updateData.size = summarizeSizes(normalizedSizes);
    }
    if (cutting !== undefined) updateData.cutting = cutting;
    if (cuttingDate !== undefined) updateData.cuttingDate = cuttingDate || null;
    if (stitching !== undefined) updateData.stitching = stitching;
    if (stitchingDate !== undefined) updateData.stitchingDate = stitchingDate || null;
    if (finishing !== undefined) updateData.finishing = finishing;
    if (finishingDate !== undefined) updateData.finishingDate = finishingDate || null;
    if (remarks !== undefined) updateData.remarks = remarks.trim();

    const updatedEntry = await ProductionTracking.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedEntry) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Production tracking entry not found",
        });
    }

    res.status(200).json({ success: true, data: updatedEntry });
  } catch (error) {
    console.error("Error updating production tracking entry:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to update production tracking entry",
      });
  }
};

// Delete production tracking entry
export const deleteProductionTrackingEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEntry = await ProductionTracking.findByIdAndDelete(id);

    if (!deletedEntry) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Production tracking entry not found",
        });
    }

    res
      .status(200)
      .json({
        success: true,
        message: "Production tracking entry deleted successfully",
      });
  } catch (error) {
    console.error("Error deleting production tracking entry:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to delete production tracking entry",
      });
  }
};
