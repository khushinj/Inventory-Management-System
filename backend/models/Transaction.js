import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  domain: {
    type: String,
    enum: ["warehouse", "shop"],
    required: true,
  },
  warehouseType: {
    type: String,
    enum: ["domestic", "export", "online", ""],
    required: function () {
      return this.domain === "warehouse";
    },
    default: "",
  },
  formType: {
    type: String,
    enum: [
      "dispatch",
      "production",
      "purchase",
      "transfer",
      "transfer inwards",
      "transfer outwards",
      "return",
      "sample",
      "sales",
      "import",
    ],
    required: true,
  },
  dno: String,
  type: String,
  color: String,
  size: String,
  qty: { type: Number, required: true },
  mrp: { type: Number },
  date: { type: Date, required: true },
  channel: {
    type: String,
    enum: [
      "retail",
      "online",
      "export",
      "domestic",
      "export return",
      "domestic return",
      "online return",
    ],
    trim: true,
  },
  receiver: { type: String, trim: true },
  supplier: { type: String, trim: true },
  transferType: {
    type: String,
    enum: ["inwards", "outwards", "received", "given"],
  },
  platform: {
    type: String,
    enum: ["amazon", "flipkart", "myntra", "ajio", "snapdeal"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

transactionSchema.index({ domain: 1, warehouseType: 1, formType: 1, date: -1 });

// Dynamic model factory so each domain/warehouse/formType gets its own collection.
const modelCache = new Map();

export const getTransactionModel = (domain, warehouseType, formType) => {
  const safeWarehouse = warehouseType || "shop";
  const name = `Txn_${domain}_${safeWarehouse}_${formType}`;
  const collection = `txn_${domain}_${safeWarehouse}_${formType}`.toLowerCase();

  if (modelCache.has(name)) return modelCache.get(name);
  if (mongoose.models[name]) return mongoose.models[name];

  const model = mongoose.model(name, transactionSchema, collection);
  modelCache.set(name, model);
  return model;
};

// Legacy default (not used by new controllers but kept for compatibility/testing)
export default mongoose.model("Transaction", transactionSchema);
