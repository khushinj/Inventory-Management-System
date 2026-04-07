import express from "express";
import StockReturned from "../models/StockReturned.js";
import ProductionTracking from "../models/ProductionTracking.js";

const router = express.Router();

// Migration endpoint to add type field to existing documents
router.post("/migrate-type-field", async (req, res) => {
  try {
    console.log("Starting migration for type field...");
    
    // Count documents without type field
    const countWithoutType = await StockReturned.countDocuments({ 
      $or: [
        { type: { $exists: false } },
        { type: null }
      ]
    });
    
    console.log(`Found ${countWithoutType} documents without type field`);
    
    // Update all documents that don't have type or have null type to empty string
    const result = await StockReturned.updateMany(
      { 
        $or: [
          { type: { $exists: false } },
          { type: null }
        ]
      },
      { $set: { type: "" } }
    );
    
    console.log(`Migration completed. Modified ${result.modifiedCount} documents`);
    
    res.json({
      success: true,
      message: `Migration completed successfully`,
      documentsFound: countWithoutType,
      documentsModified: result.modifiedCount
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post("/migrate-production-dates", async (req, res) => {
  try {
    const entriesToMigrate = await ProductionTracking.find({
      $or: [
        { cuttingDate: { $exists: false } },
        { cuttingDate: null },
        { stitchingDate: { $exists: false } },
        { stitchingDate: null },
        { finishingDate: { $exists: false } },
        { finishingDate: null },
      ],
    });

    let modifiedCount = 0;

    for (const entry of entriesToMigrate) {
      const fallbackDate = entry.createdAt || new Date();
      let needsUpdate = false;

      if (!entry.cuttingDate) {
        entry.cuttingDate = fallbackDate;
        needsUpdate = true;
      }

      if (!entry.stitchingDate) {
        entry.stitchingDate = fallbackDate;
        needsUpdate = true;
      }

      if (!entry.finishingDate) {
        entry.finishingDate = fallbackDate;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await entry.save();
        modifiedCount += 1;
      }
    }

    res.json({
      success: true,
      message: "Production dates migration completed successfully",
      documentsFound: entriesToMigrate.length,
      documentsModified: modifiedCount,
    });
  } catch (error) {
    console.error("Production dates migration error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
