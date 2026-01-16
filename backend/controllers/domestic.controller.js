import { getTransactionModel } from "../models/Transaction.js";

const allowedDomesticForms = [
  "dispatch",
  "production",
  "purchase",
  "transfer",
  "return",
  "sample",
];

export const createDomesticEntry = async (req, res) => {
  try {
    if (!allowedDomesticForms.includes(req.body.formType)) {
      return res.status(400).json({ error: "Invalid domestic form type" });
    }

    const Model = getTransactionModel("warehouse", "domestic", req.body.formType);

    const data = await Model.create({
      ...req.body,
      domain: "warehouse",
      warehouseType: "domestic",
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getDomesticEntries = async (req, res) => {
  const collections = await Promise.all(
    allowedDomesticForms.map((form) =>
      getTransactionModel("warehouse", "domestic", form)
        .find()
        .sort({ date: -1 })
        .lean()
    )
  );

  const combined = collections.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(combined);
};

export const updateDomesticEntry = async (req, res) => {
  const { id } = req.params;
  const { formType } = req.body;

  if (!allowedDomesticForms.includes(formType)) {
    return res.status(400).json({ error: "Invalid domestic form type" });
  }

  try {
    const Model = getTransactionModel("warehouse", "domestic", formType);
    const updated = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return res.status(404).json({ error: "Entry not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

