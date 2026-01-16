import Transaction from "../models/Transaction.js";

export const createDomesticEntry = async (req, res) => {
  try {
    const data = await Transaction.create({
      ...req.body,
      domain: "warehouse",
      warehouseType: "domestic"
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getDomesticEntries = async (req, res) => {
  const data = await Transaction.find({
    domain: "warehouse",
    warehouseType: "domestic"
  }).sort({ date: -1 });

  res.json(data);
};

