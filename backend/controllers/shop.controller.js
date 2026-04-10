import { getTransactionModel } from "../models/Transaction.js";

const allowedShopForms = ["import", "sales", "return", "purchase"];

const createSingleShopEntry = async (payload) => {
  if (!allowedShopForms.includes(payload.formType)) {
    throw new Error("Invalid shop form type");
  }

  const Model = getTransactionModel("shop", "", payload.formType);

  const data = await Model.create({
    ...payload,
    domain: "shop",
    warehouseType: "",
  });

  // If this is a shop import (stock received), create corresponding domestic dispatch entry
  // to subtract from domestic inventory
  if (payload.formType === "import") {
    try {
      const DomesticModel = getTransactionModel("warehouse", "domestic", "dispatch");
      await DomesticModel.create({
        dno: payload.dno,
        type: payload.type,
        color: payload.color,
        size: payload.size,
        qty: payload.qty,
        date: payload.date || new Date(),
        formType: "dispatch",
        domain: "warehouse",
        warehouseType: "domestic",
        channel: "retail", // Dispatched to retail shop
        receiver: "Shop", // Mark that this went to shop
      });
    } catch (domesticErr) {
      console.error("Error creating domestic dispatch entry:", domesticErr.message);
      // Continue even if domestic entry fails - shop entry is already created
    }
  }

  return data;
};

export const createShopEntry = async (req, res) => {
  try {
    const data = await createSingleShopEntry(req.body);

    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const createShopEntriesBulk = async (req, res) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "entries must be a non-empty array" });
    }

    const created = await Promise.all(entries.map((entry) => createSingleShopEntry(entry)));
    res.status(201).json({ count: created.length, data: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getShopEntries = async (req, res) => {
  try {
    const results = await Promise.all(
      allowedShopForms.map((form) =>
        getTransactionModel("shop", "", form)
          .find()
          .sort({ date: -1 })
          .lean()
      )
    );

    const combined = results.flat().sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(combined);
  } catch (err) {
    console.error("Error fetching shop entries:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateShopEntry = async (req, res) => {
  const { id } = req.params;

  try {
    let updated = null;

    for (const form of allowedShopForms) {
      const CurrentModel = getTransactionModel("shop", "", form);
      const existing = await CurrentModel.findById(id);
      if (!existing) continue;

      const newFormType = req.body.formType || existing.formType;
      if (!allowedShopForms.includes(newFormType)) {
        return res.status(400).json({ error: "Invalid shop form type" });
      }

      // Handle domestic inventory synchronization
      const wasImport = existing.formType === "import";
      const willBeImport = newFormType === "import";

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

        // If it's an import being updated, update the domestic dispatch entry
        if (willBeImport) {
          try {
            const DomesticModel = getTransactionModel("warehouse", "domestic", "dispatch");
            // Delete old domestic dispatch entry
            await DomesticModel.deleteOne({
              dno: existing.dno,
              type: existing.type,
              color: existing.color,
              size: existing.size,
              qty: existing.qty,
              receiver: "Shop",
            });
            // Create new domestic dispatch entry
            await DomesticModel.create({
              dno: req.body.dno || existing.dno,
              type: req.body.type || existing.type,
              color: req.body.color || existing.color,
              size: req.body.size || existing.size,
              qty: req.body.qty || existing.qty,
              date: req.body.date || existing.date || new Date(),
              formType: "dispatch",
              domain: "warehouse",
              warehouseType: "domestic",
              channel: "retail",
              receiver: "Shop",
            });
          } catch (domesticErr) {
            console.error("Error updating domestic dispatch entry:", domesticErr.message);
          }
        }
      } else {
        const TargetModel = getTransactionModel("shop", "", newFormType);
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

        // Handle domestic inventory changes when formType changes
        if (wasImport && !willBeImport) {
          // Was import, now something else - delete domestic dispatch entry
          try {
            const DomesticModel = getTransactionModel("warehouse", "domestic", "dispatch");
            await DomesticModel.deleteOne({
              dno: existing.dno,
              type: existing.type,
              color: existing.color,
              size: existing.size,
              qty: existing.qty,
              receiver: "Shop",
            });
          } catch (domesticErr) {
            console.error("Error deleting domestic dispatch entry:", domesticErr.message);
          }
        } else if (!wasImport && willBeImport) {
          // Wasn't import, now is - create domestic dispatch entry
          try {
            const DomesticModel = getTransactionModel("warehouse", "domestic", "dispatch");
            await DomesticModel.create({
              dno: req.body.dno || existing.dno,
              type: req.body.type || existing.type,
              color: req.body.color || existing.color,
              size: req.body.size || existing.size,
              qty: req.body.qty || existing.qty,
              date: req.body.date || existing.date || new Date(),
              formType: "dispatch",
              domain: "warehouse",
              warehouseType: "domestic",
              channel: "retail",
              receiver: "Shop",
            });
          } catch (domesticErr) {
            console.error("Error creating domestic dispatch entry:", domesticErr.message);
          }
        }
      }
      break;
    }

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

    // If deleted entry was an import, also delete the corresponding domestic dispatch entry
    if (deleted.formType === "import") {
      try {
        const DomesticModel = getTransactionModel("warehouse", "domestic", "dispatch");
        await DomesticModel.deleteOne({
          dno: deleted.dno,
          type: deleted.type,
          color: deleted.color,
          size: deleted.size,
          qty: deleted.qty,
          receiver: "Shop",
        });
      } catch (domesticErr) {
        console.error("Error deleting domestic dispatch entry:", domesticErr.message);
      }
    }

    res.json({ message: "Entry deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
