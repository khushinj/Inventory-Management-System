import mongoose from "mongoose";

const productionTrackingSchema = new mongoose.Schema(
  {
    designNumber: {
      type: String,
      default: "",
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
    cutting: {
      type: Number,
      default: 0,
    },
    stitching: {
      type: Number,
      default: 0,
    },
    finishing: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProductionTracking", productionTrackingSchema);
