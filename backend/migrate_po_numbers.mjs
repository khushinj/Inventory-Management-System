import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define schemas inline to avoid import issues
const SizeBreakdownSchema = new mongoose.Schema(
  {
    s: { type: Number, default: 0 },
    m: { type: Number, default: 0 },
    l: { type: Number, default: 0 },
    xl: { type: Number, default: 0 },
    xxl: { type: Number, default: 0 },
    xxxl: { type: Number, default: 0 },
    xxxxl: { type: Number, default: 0 },
    xxxxxl: { type: Number, default: 0 },
    xxxxxxl: { type: Number, default: 0 },
  },
  { _id: false }
);

const PurchaseOrderItemSchema = new mongoose.Schema({
  designNumber: { type: String, required: true },
  color: { type: String, required: true },
  s: { type: Number, default: 0 },
  m: { type: Number, default: 0 },
  l: { type: Number, default: 0 },
  xl: { type: Number, default: 0 },
  xxl: { type: Number, default: 0 },
  xxxl: { type: Number, default: 0 },
  xxxxl: { type: Number, default: 0 },
  xxxxxl: { type: Number, default: 0 },
  xxxxxxl: { type: Number, default: 0 },
  qty: { type: Number, required: true },
  mrp: { type: Number, required: true },
  dis: { type: Number, default: 0 },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  tgst: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  amt: { type: Number, required: true },
});

const PurchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String },
    sequenceNumber: { type: Number },
    year: { type: Number },
    dealerName: { type: String, required: true },
    buyerName: { type: String, required: true },
    date: { type: Date, required: true },
    deadline: { type: Date },
    city: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "partially pending", "completed"],
      default: "pending",
    },
    items: [PurchaseOrderItemSchema],
    deliveredSizes: { type: [SizeBreakdownSchema], default: [] },
    totalQuantity: { type: Number, required: true },
    grossTotal: { type: Number, required: true },
    gstOutput: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    termsCondition: { type: String, default: "E & O.E." },
  },
  { timestamps: true }
);

const PurchaseOrder = mongoose.model("PurchaseOrder", PurchaseOrderSchema);

// MongoDB connection URL - use MONGO_URI to match server.js
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/inventory";

/**
 * Migration script to add orderNumber, sequenceNumber, and year fields
 * to existing purchase orders
 */
async function migratePurchaseOrders() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    // Fetch all purchase orders that don't have orderNumber
    const ordersToMigrate = await PurchaseOrder.find({
      $or: [
        { orderNumber: { $exists: false } },
        { sequenceNumber: { $exists: false } },
        { year: { $exists: false } }
      ]
    }).sort({ date: 1 }); // Sort by date ascending to maintain chronological order

    console.log(`Found ${ordersToMigrate.length} purchase orders to migrate`);

    if (ordersToMigrate.length === 0) {
      console.log("No purchase orders need migration");
      await mongoose.connection.close();
      return;
    }

    // Group orders by year and assign sequential numbers
    const yearSequences = {};

    for (const order of ordersToMigrate) {
      const orderDate = new Date(order.date);
      const year = orderDate.getFullYear();

      // Initialize sequence for this year if not exists
      if (!yearSequences[year]) {
        // Check if there are any existing orders with sequence numbers for this year
        const lastOrder = await PurchaseOrder.findOne({ 
          year,
          sequenceNumber: { $exists: true }
        })
          .sort({ sequenceNumber: -1 })
          .select('sequenceNumber')
          .lean();
        
        yearSequences[year] = lastOrder ? lastOrder.sequenceNumber : 0;
      }

      // Increment sequence for this year
      yearSequences[year]++;
      const sequenceNumber = yearSequences[year];

      // Generate order number
      const orderNumber = `PO-${year}-${String(sequenceNumber).padStart(3, '0')}`;

      // Update the order
      order.orderNumber = orderNumber;
      order.sequenceNumber = sequenceNumber;
      order.year = year;

      await order.save();

      console.log(`Migrated: ${order._id} -> ${orderNumber}`);
    }

    console.log("\nMigration completed successfully!");
    console.log(`Updated ${ordersToMigrate.length} purchase orders`);

    // Close the connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
migratePurchaseOrders();
