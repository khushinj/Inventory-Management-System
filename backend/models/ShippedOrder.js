import mongoose from "mongoose";

const shippedOrderSchema = new mongoose.Schema(
  {
    designNumber: {
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

export default mongoose.model("ShippedOrder", shippedOrderSchema);
