import { getTransactionModel } from "../models/Transaction.js";

const allowedExportForms = ["dispatch", "production", "purchase", "transfer"];

export const createExportEntry = async (req, res) => {
  try {
    if (!allowedExportForms.includes(req.body.formType)) {
      return res.status(400).json({ error: "Invalid export form type" });
    }

    const Model = getTransactionModel("warehouse", "export", req.body.formType);

    const data = await Model.create({
      ...req.body,
      domain: "warehouse",
      warehouseType: "export",
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getExportEntries = async (req, res) => {
  const collections = await Promise.all(
    allowedExportForms.map((form) =>
      getTransactionModel("warehouse", "export", form)
        .find()
        .sort({ date: -1 })
        .lean()
    )
  );

  const combined = collections.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(combined);
};

export const updateExportEntry = async (req, res) => {
  const { id } = req.params;
  const { formType } = req.body;

  if (!allowedExportForms.includes(formType)) {
    return res.status(400).json({ error: "Invalid export form type" });
  }

  try {
    const Model = getTransactionModel("warehouse", "export", formType);
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

export const deleteExportEntry = async (req, res) => {
  const { id } = req.params;

  try {
    // Try to delete from all possible export form types
    let deleted = null;
    for (const formType of allowedExportForms) {
      const Model = getTransactionModel("warehouse", "export", formType);
      deleted = await Model.findByIdAndDelete(id).lean();
      if (deleted) break;
    }

    if (!deleted) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
