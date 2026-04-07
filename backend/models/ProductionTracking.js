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
    cuttingDate: {
      type: Date,
      default: null,
    },
    stitching: {
      type: Number,
      default: 0,
    },
    stitchingDate: {
      type: Date,
      default: null,
    },
    finishing: {
      type: Number,
      default: 0,
    },
    finishingDate: {
      type: Date,
      default: null,
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
