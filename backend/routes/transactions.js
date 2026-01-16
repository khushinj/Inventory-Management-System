import express from "express";
import Transaction from "../models/Transaction.js";

const router = express.Router();

// create entry
router.post("/", async (req, res) => {
  try {
    const data = await Transaction.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get entries
router.get("/", async (req, res) => {
  const data = await Transaction.find().sort({ date: -1 });
  res.json(data);
});

export default router;
