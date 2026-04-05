import mongoose from "mongoose";

const presentStockSchema = new mongoose.Schema(
  {
    productionTrackingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionTracking",
      required: true,
      unique: true,
      index: true,
    },
    duo: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["In Finishing", "Packed", "Shipped"],
      default: "In Finishing",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PresentStock", presentStockSchema);
