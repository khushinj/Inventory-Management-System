import mongoose from "mongoose";
import dotenv from "dotenv";

import ProductionTracking from "./models/ProductionTracking.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/inventory";

async function migrateProductionDates() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    const entries = await ProductionTracking.find({
      $or: [
        { cuttingDate: { $exists: false } },
        { cuttingDate: null },
        { stitchingDate: { $exists: false } },
        { stitchingDate: null },
        { finishingDate: { $exists: false } },
        { finishingDate: null },
      ],
    });

    console.log(`Found ${entries.length} production rows to migrate`);

    let modifiedCount = 0;

    for (const entry of entries) {
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

    console.log(`Migration completed. Modified ${modifiedCount} documents`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

migrateProductionDates();