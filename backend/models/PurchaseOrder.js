import mongoose from "mongoose";

const PurchaseOrderItemSchema = new mongoose.Schema({
  designNumber: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  s: {
    type: Number,
    default: 0,
  },
  m: {
    type: Number,
    default: 0,
  },
  l: {
    type: Number,
    default: 0,
  },
  xl: {
    type: Number,
    default: 0,
  },
  xxl: {
    type: Number,
    default: 0,
  },
  xxxl: {
    type: Number,
    default: 0,
  },
  xxxxl: {
    type: Number,
    default: 0,
  },
  xxxxxl: {
    type: Number,
    default: 0,
  },
  xxxxxxl: {
    type: Number,
    default: 0,
  },
  qty: {
    type: Number,
    required: true,
  },
  mrp: {
    type: Number,
    required: true,
  },
  dis: {
    type: Number,
    default: 0,
  },
  rate: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  tgst: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  amt: {
    type: Number,
    required: true,
  },
});

const PurchaseOrderSchema = new mongoose.Schema(
  {
    dealerName: {
      type: String,
      required: true,
    },
    buyerName: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "partially pending", "completed"],
      default: "pending",
    },
    items: [PurchaseOrderItemSchema],
    totalQuantity: {
      type: Number,
      required: true,
    },
    grossTotal: {
      type: Number,
      required: true,
    },
    gstOutput: {
      type: Number,
      required: true,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    termsCondition: {
      type: String,
      default: "E & O.E.",
    },
  },
  { timestamps: true }
);

// Index for faster queries
PurchaseOrderSchema.index({ date: -1 });
PurchaseOrderSchema.index({ dealerName: 1 });
PurchaseOrderSchema.index({ buyerName: 1 });

export default mongoose.model("PurchaseOrder", PurchaseOrderSchema);
