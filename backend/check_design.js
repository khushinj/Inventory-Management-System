import mongoose from "mongoose";
import dotenv from "dotenv";
import { getTransactionModel } from "./models/Transaction.js";

dotenv.config();

async function checkDesign() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    
    const designToFind = "NGW - 351100";
    const formTypes = [
      "dispatch",
      "production",
      "purchase",
      "transfer",
      "transfer inwards",
      "transfer outwards",
      "return",
      "sample",
      "sales",
    ];

    console.log(`\n🔍 Searching for Design Number: "${designToFind}"\n`);
    console.log("=====================================\n");

    let totalFound = 0;

    for (const formType of formTypes) {
      const Model = getTransactionModel("warehouse", "domestic", formType);
      const records = await Model.find({ dno: designToFind }).lean();
      
      if (records.length > 0) {
        console.log(`✅ ${formType}: ${records.length} records`);
        records.forEach((r, i) => {
          console.log(`   [${i+1}] ${r.color} - ${r.size} - Qty: ${r.qty}`);
        });
        totalFound += records.length;
      }
    }

    if (totalFound === 0) {
      console.log(`❌ No entries found for "${designToFind}"`);
      console.log("\n📌 Available Design Numbers (first 20):");
      
      for (const formType of formTypes) {
        const Model = getTransactionModel("warehouse", "domestic", formType);
        const records = await Model.find().lean().limit(20);
        const dnos = [...new Set(records.map(r => r.dno))];
        if (dnos.length > 0) {
          console.log(`\n${formType}:`);
          dnos.forEach(dno => console.log(`   - ${dno}`));
        }
      }
    } else {
      console.log(`\n📈 Total entries for "${designToFind}": ${totalFound}`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkDesign();
