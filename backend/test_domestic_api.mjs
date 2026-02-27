import mongoose from "mongoose";
import dotenv from "dotenv";
import { getTransactionModel } from "./models/Transaction.js";

dotenv.config({ path: "./.env" });

async function testDomesticInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    const formTypes = ["dispatch", "production", "purchase", "transfer", "transfer inwards", "transfer outwards", "return", "sales", "sample"];
    
    console.log("Fetching transactions for domestic warehouse...");
    let totalCount = 0;
    
    for (const formType of formTypes) {
      const Model = getTransactionModel("warehouse", "domestic", formType);
      const count = await Model.countDocuments();
      totalCount += count;
      console.log(`  ${formType}: ${count} transactions`);
    }
    
    console.log(`\nTotal transactions: ${totalCount}`);
    
    // Test normalization logic
    console.log("\n\nTesting normalization...");
    const normalizeDesignNumber = (dno) => {
      if (!dno) return "N/A";
      return dno.toString().trim().replace(/\s+/g, "").toUpperCase();
    };
    
    const testCases = [
      "NGW - 351236A",
      "NGW - 351236 A",
      "NGW-351236A",
      "ngw-351236a"
    ];
    
    testCases.forEach(testCase => {
      console.log(`  "${testCase}" -> "${normalizeDesignNumber(testCase)}"`);
    });
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

testDomesticInventory();
