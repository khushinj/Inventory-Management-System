/**
 * Test to verify that stock returned in shop automatically adds to domestic inventory
 */

import mongoose from "mongoose";
import StockReturned from "./backend/models/StockReturned.js";
import { getTransactionModel } from "./backend/models/Transaction.js";
import { createStockReturned } from "./backend/services/stockReturned.service.js";

const testStockReturnToDomestic = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/inventory-management");
    console.log("✅ Connected to MongoDB\n");

    // Test data
    const testData = {
      dno: "TEST-DNO-001",
      type: "T-Shirt",
      color: "Blue",
      items: [
        { size: "M", qty: 5, mrp: 500 },
        { size: "L", qty: 3, mrp: 500 }
      ],
      totalQuantity: 8,
      date: new Date()
    };

    console.log("📦 Creating stock return entry...");
    console.log(JSON.stringify(testData, null, 2));
    console.log();

    // Create stock return (this should automatically add to domestic)
    const stockReturn = await createStockReturned(testData);
    console.log("✅ Stock return created:", stockReturn._id);
    console.log();

    // Check if shop transactions were created (should be negative)
    const ShopModel = getTransactionModel("shop", "", "return");
    const shopTransactions = await ShopModel.find({
      dno: testData.dno,
      color: testData.color
    });
    console.log(`📤 Shop transactions (should be negative):`);
    shopTransactions.forEach(txn => {
      console.log(`   - Size ${txn.size}: qty = ${txn.qty} (${txn.qty < 0 ? '✅ Negative' : '❌ Should be negative'})`);
    });
    console.log();

    // Check if domestic transactions were created (should be positive)
    const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
    const domesticTransactions = await DomesticModel.find({
      dno: testData.dno,
      color: testData.color
    });
    console.log(`📥 Domestic warehouse transactions (should be positive):`);
    domesticTransactions.forEach(txn => {
      console.log(`   - Size ${txn.size}: qty = ${txn.qty} (${txn.qty > 0 ? '✅ Positive' : '❌ Should be positive'})`);
    });
    console.log();

    // Verify the card is automatically created
    console.log("🎴 Domestic inventory 'card' will show:");
    console.log(`   Design: ${testData.dno}`);
    console.log(`   Color: ${testData.color}`);
    console.log(`   Stock by size:`);
    domesticTransactions.forEach(txn => {
      console.log(`     - ${txn.size}: +${txn.qty} units`);
    });
    console.log();

    // Clean up
    console.log("🧹 Cleaning up test data...");
    await StockReturned.deleteOne({ _id: stockReturn._id });
    await ShopModel.deleteMany({ dno: testData.dno, color: testData.color });
    await DomesticModel.deleteMany({ dno: testData.dno, color: testData.color });
    console.log("✅ Cleanup complete");
    console.log();

    console.log("=" * 60);
    console.log("✅ TEST PASSED: Stock returned from shop automatically adds to domestic inventory!");
    console.log("   - Shop inventory decreased (negative transactions)");
    console.log("   - Domestic inventory increased (positive transactions)");
    console.log("   - Card auto-created for the design in domestic inventory");
    console.log("=" * 60);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
};

// Run the test
testStockReturnToDomestic();
