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

  try {
    let updated = null;

    for (const form of allowedDomesticForms) {
      const CurrentModel = getTransactionModel("warehouse", "domestic", form);
      const existing = await CurrentModel.findById(id);
      if (!existing) continue;

      const newFormType = req.body.formType || existing.formType;
      if (!allowedDomesticForms.includes(newFormType)) {
        return res.status(400).json({ error: "Invalid domestic form type" });
      }

      if (newFormType === existing.formType) {
        updated = await CurrentModel.findByIdAndUpdate(
          id,
          {
            ...req.body,
            formType: existing.formType,
            domain: existing.domain,
            warehouseType: existing.warehouseType,
          },
          {
            new: true,
            runValidators: true,
          }
        ).lean();
      } else {
        const TargetModel = getTransactionModel("warehouse", "domestic", newFormType);
        const payload = {
          ...existing.toObject(),
          ...req.body,
          formType: newFormType,
          domain: existing.domain,
          warehouseType: existing.warehouseType,
          _id: existing._id,
        };

        const created = await TargetModel.create(payload);
        await CurrentModel.findByIdAndDelete(id);
        updated = created?.toObject ? created.toObject() : created;
      }
      break;
    }

    if (!updated) return res.status(404).json({ error: "Entry not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteDomesticEntry = async (req, res) => {
  const { id } = req.params;

  try {
    // Try to delete from all possible domestic form types
    let deleted = null;
    for (const formType of allowedDomesticForms) {
      const Model = getTransactionModel("warehouse", "domestic", formType);
      deleted = await Model.findByIdAndDelete(id).lean();
      if (deleted) break;
    }

    if (!deleted) return res.status(404).json({ error: "Entry not found" });
    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

