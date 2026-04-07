import ProductionTracking from "../models/ProductionTracking.js";

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
      cutting,
      cuttingDate,
      stitching,
      stitchingDate,
      finishing,
      finishingDate,
      remarks,
    } = req.body;
    const today = new Date().toISOString();

    if (!color || !size) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Color and Size are required fields",
        });
    }

    const newEntry = new ProductionTracking({
      designNumber: designNumber ? designNumber.trim() : "",
      color: color.trim(),
      size: size.trim(),
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
    if (size !== undefined) updateData.size = size.trim();
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
