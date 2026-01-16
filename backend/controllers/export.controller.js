import Transaction from "../models/Transaction.js";

export const createExportEntry = async (req, res) => {
  try {
    const data = await Transaction.create({
      ...req.body,
      domain: "warehouse",
      warehouseType: "export"
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getExportEntries = async (req, res) => {
  const data = await Transaction.find({
    warehouseType: "export"
  }).sort({ date: -1 });

  res.json(data);
};
