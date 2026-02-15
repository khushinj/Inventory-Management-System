import mongoose from "mongoose";

const StockReturnedItemSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
    },
    qty: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const StockReturnedSchema = new mongoose.Schema(
  {
    dno: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    items: [StockReturnedItemSchema],
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
StockReturnedSchema.index({ date: -1 });
StockReturnedSchema.index({ dno: 1, color: 1 });

const StockReturned = mongoose.model("StockReturned", StockReturnedSchema);

export default StockReturned;
