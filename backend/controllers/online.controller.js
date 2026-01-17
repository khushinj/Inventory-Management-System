import { getTransactionModel } from "../models/Transaction.js";

const allowedOnlineForms = ["return", "sales", "transfer", "purchase"];

export const createOnlineEntry = async (req, res) => {
  try {
    if (!allowedOnlineForms.includes(req.body.formType)) {
      return res.status(400).json({ error: "Invalid online form type" });
    }

    const Model = getTransactionModel("warehouse", "online", req.body.formType);

    const data = await Model.create({
      ...req.body,
      domain: "warehouse",
      warehouseType: "online",
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getOnlineEntries = async (req, res) => {
  const collections = await Promise.all(
    allowedOnlineForms.map((form) =>
      getTransactionModel("warehouse", "online", form)
        .find()
        .sort({ date: -1 })
        .lean()
    )
  );

  const combined = collections.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(combined);
};

export const updateOnlineEntry = async (req, res) => {
  const { id } = req.params;
  const { formType } = req.body;

  if (!allowedOnlineForms.includes(formType)) {
    return res.status(400).json({ error: "Invalid online form type" });
  }

  try {
    const Model = getTransactionModel("warehouse", "online", formType);
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

export const deleteOnlineEntry = async (req, res) => {
  const { id } = req.params;

  try {
    // Try to delete from all possible online form types
    let deleted = null;
    for (const formType of allowedOnlineForms) {
      const Model = getTransactionModel("warehouse", "online", formType);
      deleted = await Model.findByIdAndDelete(id).lean();
      if (deleted) break;
    }

    if (!deleted) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
