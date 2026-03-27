import ShippedOrder from "../models/ShippedOrder.js";

export const getAllShippedOrders = async (req, res) => {
  try {
    const entries = await ShippedOrder.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: entries });
  } catch (error) {
    console.error("Error fetching shipped orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch shipped orders" });
  }
};

export const getShippedOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await ShippedOrder.findById(id);

    if (!entry) {
      return res.status(404).json({ success: false, message: "Shipped order not found" });
    }

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    console.error("Error fetching shipped order:", error);
    res.status(500).json({ success: false, message: "Failed to fetch shipped order" });
  }
};

export const createShippedOrder = async (req, res) => {
  try {
    const { designNumber, status } = req.body;

    if (!designNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Design Number is a required field" });
    }

    const newEntry = new ShippedOrder({
      designNumber: designNumber.trim(),
      status: status || "In Cutting",
    });

    const savedEntry = await newEntry.save();
    res.status(201).json({ success: true, data: savedEntry });
  } catch (error) {
    console.error("Error creating shipped order:", error);
    res.status(500).json({ success: false, message: "Failed to create shipped order" });
  }
};

export const updateShippedOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { designNumber, status } = req.body;

    const updateData = {};
    if (designNumber !== undefined) updateData.designNumber = designNumber.trim();
    if (status !== undefined) updateData.status = status;

    const updatedEntry = await ShippedOrder.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedEntry) {
      return res.status(404).json({ success: false, message: "Shipped order not found" });
    }

    res.status(200).json({ success: true, data: updatedEntry });
  } catch (error) {
    console.error("Error updating shipped order:", error);
    res.status(500).json({ success: false, message: "Failed to update shipped order" });
  }
};

export const deleteShippedOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEntry = await ShippedOrder.findByIdAndDelete(id);
    if (!deletedEntry) {
      return res.status(404).json({ success: false, message: "Shipped order not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Shipped order deleted successfully" });
  } catch (error) {
    console.error("Error deleting shipped order:", error);
    res.status(500).json({ success: false, message: "Failed to delete shipped order" });
  }
};
