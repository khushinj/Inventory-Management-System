import mongoose from "mongoose";
import StockReturned from "./models/StockReturned.js";
import { getTransactionModel } from "./models/Transaction.js";

async function diagnose() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/inventory-management");
    console.log("✅ Connected to MongoDB\n");

    // Check stock returned entries
    const stockReturnedCount = await StockReturned.countDocuments();
    console.log(`📦 Total Stock Returned entries: ${stockReturnedCount}`);

    if (stockReturnedCount > 0) {
      const latestReturn = await StockReturned.findOne().sort({ date: -1 });
      console.log(`\n📋 Latest Stock Return entry:`);
      console.log(`   DNO: ${latestReturn.dno}`);
      console.log(`   Color: ${latestReturn.color}`);
      console.log(`   Total Quantity: ${latestReturn.totalQuantity}`);
      console.log(`   Items: ${latestReturn.items?.length || 0}`);
      if (latestReturn.items && latestReturn.items.length > 0) {
        latestReturn.items.forEach(item => {
          console.log(`     - Size ${item.size}: ${item.qty} units`);
        });
      }
      console.log(`   Date: ${latestReturn.date}`);
      console.log(`   ID: ${latestReturn._id}`);

      // Check if shop transactions were created
      const ShopModel = getTransactionModel("shop", "", "return");
      const shopTransactions = await ShopModel.find({
        dno: latestReturn.dno,
        color: latestReturn.color,
      });
      console.log(`\n📤 Shop transactions for this entry: ${shopTransactions.length}`);
      shopTransactions.forEach(txn => {
        console.log(`   - Size ${txn.size}: ${txn.qty} (${txn.qty < 0 ? 'Negative ✅' : 'Positive ❌'})`);
      });

      // Check if domestic transactions were created
      const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
      const domesticTransactions = await DomesticModel.find({
        dno: latestReturn.dno,
        color: latestReturn.color,
      });
      console.log(`\n📥 Domestic warehouse transactions for this entry: ${domesticTransactions.length}`);
      domesticTransactions.forEach(txn => {
        console.log(`   - Size ${txn.size}: ${txn.qty} (${txn.qty > 0 ? 'Positive ✅' : 'Negative ❌'})`);
      });

      if (domesticTransactions.length === 0) {
        console.log("\n❌ PROBLEM FOUND: No domestic transactions created!");
        console.log("   This means the adjustInventoryForStockReturned function is not working.");
      } else if (domesticTransactions.length !== latestReturn.items?.length) {
        console.log(`\n⚠️  WARNING: Mismatch in transaction count`);
        console.log(`   Items in stock return: ${latestReturn.items?.length || 0}`);
        console.log(`   Domestic transactions: ${domesticTransactions.length}`);
      } else {
        console.log("\n✅ Transactions created correctly!");
      }

      // Check all stock returned entries
      console.log("\n\n📊 Summary of all Stock Returned entries:");
      const allReturns = await StockReturned.find().sort({ date: -1 }).limit(5);
      for (const entry of allReturns) {
        const domTxns = await DomesticModel.find({
          dno: entry.dno,
          color: entry.color,
        });
        console.log(`   ${entry.dno} (${entry.color}): ${entry.totalQuantity} units - Domestic txns: ${domTxns.length}`);
      }
    } else {
      console.log("\n⚠️  No stock returned entries found in database");
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
  }
}

diagnose();
