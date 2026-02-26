import mongoose from "mongoose";
import { getTransactionModel } from "./models/Transaction.js";
import StockReturned from "./models/StockReturned.js";

async function diagnoseShopInventory() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/inventory-management");
    console.log("✅ Connected to MongoDB\n");

    // 1. Check if there are stock returned entries
    const stockReturnedCount = await StockReturned.countDocuments();
    console.log(`📦 Total Stock Returned entries: ${stockReturnedCount}`);

    if (stockReturnedCount > 0) {
      const latestReturn = await StockReturned.findOne().sort({ date: -1 });
      console.log(`\n📋 Latest Stock Return entry:`);
      console.log(`   DNO: ${latestReturn.dno}`);
      console.log(`   Color: ${latestReturn.color}`);
      console.log(`   Items:`, latestReturn.items);

      // 2. Check shop transactions for this return
      const ShopReturnModel = getTransactionModel("shop", "", "return");
      const shopReturnTxns = await ShopReturnModel.find({
        dno: latestReturn.dno,
        color: latestReturn.color,
      });

      console.log(`\n📤 Shop 'return' transactions for ${latestReturn.dno}:`);
      console.log(`   Found: ${shopReturnTxns.length} transactions`);
      shopReturnTxns.forEach(txn => {
        console.log(`   - Size ${txn.size}: qty=${txn.qty}, formType=${txn.formType}, domain=${txn.domain}`);
      });

      // 3. Check all shop formTypes to see what exists
      console.log(`\n📊 Checking all shop form types:`);
      const formTypes = ['import', 'return', 'sales'];
      
      for (const formType of formTypes) {
        const Model = getTransactionModel("shop", "", formType);
        const count = await Model.countDocuments();
        console.log(`   ${formType}: ${count} transactions`);
        
        if (formType === 'return' && count > 0) {
          const samples = await Model.find({}).limit(3);
          console.log(`\n   Sample 'return' transactions:`);
          samples.forEach(txn => {
            console.log(`     - DNO: ${txn.dno}, Color: ${txn.color}, Size: ${txn.size}, Qty: ${txn.qty}`);
          });
        }
      }

      // 4. Check if shop import transactions exist for comparison
      console.log(`\n📥 Checking shop 'import' transactions for ${latestReturn.dno}:`);
      const ShopImportModel = getTransactionModel("shop", "", "import");
      const shopImportTxns = await ShopImportModel.find({
        dno: latestReturn.dno,
        color: latestReturn.color,
      });
      console.log(`   Found: ${shopImportTxns.length} import transactions`);
      shopImportTxns.forEach(txn => {
        console.log(`   - Size ${txn.size}: qty=${txn.qty}`);
      });

      // 5. Check shop sales transactions
      console.log(`\n📤 Checking shop 'sales' transactions for ${latestReturn.dno}:`);
      const ShopSalesModel = getTransactionModel("shop", "", "sales");
      const shopSalesTxns = await ShopSalesModel.find({
        dno: latestReturn.dno,
        color: latestReturn.color,
      });
      console.log(`   Found: ${shopSalesTxns.length} sales transactions`);
      shopSalesTxns.forEach(txn => {
        console.log(`   - Size ${txn.size}: qty=${txn.qty}`);
      });

      console.log(`\n💡 EXPECTED CALCULATION for ${latestReturn.dno}:`);
      console.log(`   Net Stock = (Import + Return) - Sales`);
      console.log(`   Note: Return transactions should have NEGATIVE qty values`);
      console.log(`   Example: If Import=10, Return=-5, Sales=2`);
      console.log(`   Then: Net = (10 + (-5)) - 2 = 3`);

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

diagnoseShopInventory();
