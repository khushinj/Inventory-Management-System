import Transaction from "../models/Transaction.js";

export const createShopEntry = async (req, res) => {
  try {
    const data = await Transaction.create({
      ...req.body,
      domain: "shop"
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getShopEntries = async (req, res) => {
  const data = await Transaction.find({ domain: "shop" }).sort({ date: -1 });
  res.json(data);
};
