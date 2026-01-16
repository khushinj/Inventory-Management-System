import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import transactionRoutes from "./routes/transactions.js";
import shopRoutes from "./routes/shop.route.js";
import domesticRoutes from "./routes/domestic.route.js";
import exportRoutes from "./routes/export.route.js";
import onlineRoutes from "./routes/online.route.js";


dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
// app.use("/api/transactions", transactionRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/warehouse/domestic", domesticRoutes);
app.use("/api/warehouse/export", exportRoutes);
app.use("/api/warehouse/online", onlineRoutes);

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
