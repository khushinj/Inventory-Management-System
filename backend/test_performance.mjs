import mongoose from "mongoose";
import dotenv from "dotenv";
import { calculateWarehouseInventory } from "./services/warehouseInventory.service.js";

dotenv.config({ path: "./.env" });

async function testInventoryPerformance() {
  try {
    console.time("MongoDB Connection");
    await mongoose.connect(process.env.MONGO_URI);
    console.timeEnd("MongoDB Connection");
    
    console.log("\n--- Testing Domestic Inventory Calculation ---\n");
    
    console.time("calculateWarehouseInventory");
    const inventory = await calculateWarehouseInventory("domestic");
    console.timeEnd("calculateWarehouseInventory");
    
    const items = Object.values(inventory);
    console.log(`\nTotal inventory items: ${items.length}`);
    
    if (items.length > 0) {
      console.log("\nFirst 3 items:");
      items.slice(0, 3).forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.dno} - ${item.color} - ${item.size}: stock=${item.stock}, inbound=${item.inbound}, outbound=${item.outbound}`);
      });
    }
    
    console.log("\n--- Serialization Test ---");
    console.time("JSON.stringify");
    const json = JSON.stringify({ inventory: items });
    console.timeEnd("JSON.stringify");
    console.log(`JSON size: ${(json.length / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
  }
}

testInventoryPerformance();
