import express from "express";
import StockReturned from "../models/StockReturned.js";

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

export default router;
