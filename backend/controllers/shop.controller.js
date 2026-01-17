import { getTransactionModel } from "../models/Transaction.js";

const allowedShopForms = ["import", "sales", "return", "purchase"];

export const createShopEntry = async (req, res) => {
  try {
    if (!allowedShopForms.includes(req.body.formType)) {
      return res.status(400).json({ error: "Invalid shop form type" });
    }

    const Model = getTransactionModel("shop", "", req.body.formType);

    const data = await Model.create({
      ...req.body,
      domain: "shop",
      warehouseType: "",
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getShopEntries = async (req, res) => {
  const results = await Promise.all(
    allowedShopForms.map((form) =>
      getTransactionModel("shop", "", form).find().sort({ date: -1 }).lean()
    )
  );

  const combined = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(combined);
};

export const updateShopEntry = async (req, res) => {
  const { id } = req.params;
  const { formType } = req.body;

  if (!allowedShopForms.includes(formType)) {
    return res.status(400).json({ error: "Invalid shop form type" });
  }

  try {
    const Model = getTransactionModel("shop", "", formType);
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

export const deleteShopEntry = async (req, res) => {
  const { id } = req.params;

  try {
    // Try to delete from all possible shop form types
    let deleted = null;
    for (const formType of allowedShopForms) {
      const Model = getTransactionModel("shop", "", formType);
      deleted = await Model.findByIdAndDelete(id).lean();
      if (deleted) break;
    }

    if (!deleted) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
