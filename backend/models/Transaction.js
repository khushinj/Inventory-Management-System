import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  domain: {
    type: String,
    enum: ["warehouse", "shop"],
    required: true
  },
  warehouseType: {
    type: String,
    enum: ["domestic", "export", "online"],
    required: function () {
      return this.domain === "warehouse";
    }
  },
  formType: {
    type: String,
    enum: [
      "dispatch",
      "production",
      "purchase",
      "transfer",
      "return",
      "sample",
      "sales",
      "import"
    ],
    required: true
  },
  dno: String,
  type: String,
  color: String,
  size: String,
  qty: { type: Number, required: true },
  date: { type: Date, required: true },
  channel: String,
  receiver: String,
  supplier: String,
  transferType: String,
  platform: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Transaction", transactionSchema);
