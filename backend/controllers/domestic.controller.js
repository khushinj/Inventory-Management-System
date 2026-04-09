import { getTransactionModel } from "../models/Transaction.js";

const allowedDomesticForms = [
  "dispatch",
  "production",
  "purchase",
  "transfer",
  "transfer inwards",
  "transfer outwards",
  "return",
  "sample",
  "sales",
];

export const createDomesticEntry = async (req, res) => {
  try {
    if (!allowedDomesticForms.includes(req.body.formType)) {
      return res.status(400).json({ error: "Invalid domestic form type" });
    }

    // Auto-set channel to "online" for sales form type
    const channel = req.body.formType === "sales" ? "online" : req.body.channel;

    const Model = getTransactionModel("warehouse", "domestic", req.body.formType);

    const data = await Model.create({
      ...req.body,
      channel,
      domain: "warehouse",
      warehouseType: "domestic",
    });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const createDomesticEntriesBulk = async (req, res) => {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "Entries array is required" });
    }

    const grouped = new Map();
    const rejected = [];

    entries.forEach((entry, index) => {
      const formType = entry?.formType;
      if (!allowedDomesticForms.includes(formType)) {
        rejected.push({ index, reason: "Invalid domestic form type" });
        return;
      }

      const channel = formType === "sales" ? "online" : entry?.channel;
      const payload = {
        ...entry,
        channel,
        domain: "warehouse",
        warehouseType: "domestic",
      };

      if (!grouped.has(formType)) grouped.set(formType, []);
      grouped.get(formType).push(payload);
    });

    let inserted = 0;
    const errors = [];

    for (const [formType, payloads] of grouped.entries()) {
      const Model = getTransactionModel("warehouse", "domestic", formType);
      try {
        const result = await Model.insertMany(payloads, { ordered: false });
        inserted += result.length;
      } catch (err) {
        const writeErrors = err?.writeErrors || [];
        const failed = writeErrors.length;
        inserted += payloads.length - failed;

        writeErrors.forEach((writeError) => {
          errors.push({
            formType,
            index: writeError.index,
            message: writeError.errmsg || writeError.message,
          });
        });
      }
    }

    res.status(201).json({
      inserted,
      rejected,
      errors,
      total: entries.length,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getDomesticEntries = async (req, res) => {
  try {
    const { formType, channel } = req.query;
    let formsToFetch = allowedDomesticForms;

    // If specific formType is requested, only fetch that
    if (formType && allowedDomesticForms.includes(formType)) {
      formsToFetch = [formType];
    }

    // Optimize by selecting only necessary fields
    const txnFields = "_id dno qty mrp date createdAt color size receiver supplier channel formType";

    const collections = await Promise.all(
      formsToFetch.map((form) =>
        getTransactionModel("warehouse", "domestic", form)
          .find(channel ? { channel } : {})
          .select(txnFields)
          .sort({ date: -1 })
          .lean()
          .limit(1000) // Limit to last 1000 entries
      )
    );

    const combined = collections.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(combined);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
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

      // Auto-set channel to "online" for sales form type
      const channel = newFormType === "sales" ? "online" : req.body.channel;

      if (newFormType === existing.formType) {
        updated = await CurrentModel.findByIdAndUpdate(
          id,
          {
            ...req.body,
            channel,
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
          channel,
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
    res.json({ message: "Entry deleted successfully", success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(400).json({ error: err.message });
  }
};

