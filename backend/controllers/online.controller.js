import Transaction from "../models/Transaction.js";

export const createOnlineEntry = async (req, res) => {
  try {
    const data = await Transaction.create({
      ...req.body,
      domain: "warehouse",
      warehouseType: "online"
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getOnlineEntries = async (req, res) => {
  const data = await Transaction.find({
    warehouseType: "online"
  }).sort({ date: -1 });

  res.json(data);
};
