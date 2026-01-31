import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

const shopInventorySchema = new mongoose.Schema(
  {
    dno: String,
    color: String,
    size: String,
    qty: Number,
    lastUpdated: Date,
  },
  { collection: "shop_inventory" }
);

const ShopInventory = mongoose.model("ShopInventory", shopInventorySchema);

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to MongoDB");
  const count = await ShopInventory.countDocuments();
  console.log("Total documents:", count);
  
  const sample = await ShopInventory.findOne();
  if (sample) {
    console.log("Sample:", sample);
  }
  
  mongoose.connection.close();
}).catch(err => console.error("Error:", err.message));
