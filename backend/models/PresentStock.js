import mongoose from "mongoose";

const presentStockSchema = new mongoose.Schema(
  {
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
      enum: ["In Cutting", "In Stitching", "In Finishing", "Packed", "Shipped"],
      default: "In Cutting",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("PresentStock", presentStockSchema);
