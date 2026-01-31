import ShopInventory from "./models/ShopInventory.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Connect first
await mongoose.connect(process.env.MONGO_URI);

console.log("Mongoose connection state:", mongoose.connection.readyState);
console.log("Connected to DB:", mongoose.connection.name);

// Try to find documents
const count = await ShopInventory.countDocuments();
console.log("Count from ShopInventory model:", count);

// Try raw collection
const rawDb = mongoose.connection.db;
if (rawDb) {
  const collectionNames = await rawDb.listCollections().toArray();
  console.log("Collections in connected DB:", collectionNames.map(c => c.name));
  
  const count2 = await rawDb.collection('shop_inventory').countDocuments();
  console.log("Count from raw DB collection:", count2);
}

await mongoose.connection.close();
process.exit(0);
