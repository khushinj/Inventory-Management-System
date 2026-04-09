import { getTransactionModel } from "../models/Transaction.js";

const allowedOnlineForms = ["return", "sales", "transfer", "purchase", "transfer inwards", "transfer outwards"];

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
  try {
    // Optimize by selecting only necessary fields
    const txnFields = "_id dno qty mrp date createdAt color size channel formType platform";

    const collections = await Promise.all(
      allowedOnlineForms.map((form) =>
        getTransactionModel("warehouse", "online", form)
          .find()
          .select(txnFields)
          .sort({ date: -1 })
          .lean()
          .limit(800) // Limit to last 800 entries
          .catch((err) => {
            console.error(`Error fetching online form collection '${form}':`, err.message);
            return [];
          })
      )
    );

    const combined = collections.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(combined);
  } catch (err) {
    console.error("Error fetching online entries:", err);
    res.status(500).json({ error: err.message || "Failed to fetch online entries" });
  }
};

export const updateOnlineEntry = async (req, res) => {
  const { id } = req.params;

  try {
    let updated = null;

    for (const form of allowedOnlineForms) {
      const CurrentModel = getTransactionModel("warehouse", "online", form);
      const existing = await CurrentModel.findById(id);
      if (!existing) continue;

      const newFormType = req.body.formType || existing.formType;
      if (!allowedOnlineForms.includes(newFormType)) {
        return res.status(400).json({ error: "Invalid online form type" });
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
        const TargetModel = getTransactionModel("warehouse", "online", newFormType);
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
