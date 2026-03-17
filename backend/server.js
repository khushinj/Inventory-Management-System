import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import transactionRoutes from "./routes/transactions.js";
import shopRoutes from "./routes/shop.route.js";
import domesticRoutes from "./routes/domestic.route.js";
import onlineRoutes from "./routes/online.route.js";
import jobCardRoutes from "./routes/jobCard.route.js";
import shopInventoryRoutes from "./routes/shopInventory.route.js";
import dailyReportRoutes from "./routes/dailyReport.route.js";
import onlineDailyReportRoutes from "./routes/onlineDailyReport.route.js";
import inventoryRoutes from "./routes/inventory.route.js";
import purchaseOrderRoutes from "./routes/purchaseOrder.route.js";
import stockReturnedRoutes from "./routes/stockReturned.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import migrationRoutes from "./routes/migration.route.js";


dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// routes
// app.use("/api/transactions", transactionRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/warehouse/domestic", domesticRoutes);
app.use("/api/warehouse/online", onlineRoutes);
app.use("/api/domestic", domesticRoutes);
app.use("/api/online", onlineRoutes);
app.use("/api/jobcard", jobCardRoutes);
app.use("/api/shop-inventory", shopInventoryRoutes);
app.use("/api/daily-report", dailyReportRoutes);
app.use("/api/online-daily-report", onlineDailyReportRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchase-order", purchaseOrderRoutes);
app.use("/api/stock-returned", stockReturnedRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", migrationRoutes);

// test route
app.get("/", (req, res) => {
  res.send("Inventory backend running");
});

// db connect
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected (FREE Atlas)");
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
  });
