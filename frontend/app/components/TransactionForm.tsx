"use client";
import { useState } from "react";
import { api } from "../../lib/api";
import Link from "next/link";

export default function TransactionForm({ selection }) {
  const [domain, setDomain] = useState<"shop" | "warehouse">("warehouse");

  const [form, setForm] = useState({
    dno: "",
    type: "",
    color: "",
    size: "",
    qty: "",
    date: "",
    channel: "",
    receiver: "",
    supplier: "",
    transferType: "",
    platform: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    if (!form.qty || !form.date) {
      alert("Qty and Date are required");
      return;
    }

    let endpoint = "";

    if (domain === "shop") {
      endpoint = "/shop";
    } else {
      endpoint = `/warehouse/${warehouseType}`;
    }

    try {
      const res = await api.post(endpoint, {
        ...form,
        formType,
      });

      console.log("Saved:", res.data);
      alert("Saved successfully");
      setForm({
        dno: "",
        type: "",
        color: "",
        size: "",
        qty: "",
        date: "",
        channel: "",
        receiver: "",
        supplier: "",
        transferType: "",
        platform: "",
      });
    } catch (err: any) {
      console.error("AXIOS ERROR:", err);

      if (err.response) {
        alert(err.response.data.error || "Backend error");
      } else {
        alert("Backend not reachable");
      }
    }
  };

  const { warehouseType, formType } = selection;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/">
          <button className="text-blue-600 hover:underline mb-4">← Back to Dashboard</button>
        </Link>
        <h2 className="text-2xl font-bold">Create New Entry</h2>
        <p className="text-gray-600">Add a new inventory transaction</p>
      </div>

      <div className="bg-white border rounded-lg p-8 space-y-4">
        {/* Domain Toggle */}
        <div>
          <label className="block text-sm font-semibold mb-2">Domain</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as "shop" | "warehouse")}
            className="border px-4 py-2 w-full rounded"
          >
            <option value="warehouse">Warehouse</option>
            <option value="shop">Shop</option>
          </select>
        </div>

        {/* Warehouse Type (only if domain = warehouse) */}
        {domain === "warehouse" && (
          <div>
            <label className="block text-sm font-semibold mb-2">
              Warehouse Type
            </label>
            <select className="border px-4 py-2 w-full rounded" disabled>
              <option value={warehouseType}>{warehouseType}</option>
            </select>
          </div>
        )}

        {/* Form Type */}
        <div>
          <label className="block text-sm font-semibold mb-2">Form Type</label>
          <select className="border px-4 py-2 w-full rounded" disabled>
            <option value={formType}>{formType}</option>
          </select>
        </div>

        {/* Design Number */}
        <div>
          <label className="block text-sm font-semibold mb-2">Design Number (DNO)</label>
          <input
            className="border px-4 py-2 w-full rounded"
            name="dno"
            placeholder="e.g., D001"
            value={form.dno}
            onChange={handleChange}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-semibold mb-2">Type</label>
          <input
            className="border px-4 py-2 w-full rounded"
            name="type"
            placeholder="e.g., T-Shirt"
            value={form.type}
            onChange={handleChange}
          />
        </div>

        {/* Color & Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Color</label>
            <input
              className="border px-4 py-2 w-full rounded"
              name="color"
              placeholder="e.g., Red"
              value={form.color}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Size</label>
            <input
              className="border px-4 py-2 w-full rounded"
              name="size"
              placeholder="e.g., M"
              value={form.size}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Quantity & Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Quantity *</label>
            <input
              className="border px-4 py-2 w-full rounded"
              name="qty"
              type="number"
              placeholder="0"
              value={form.qty}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Date *</label>
            <input
              className="border px-4 py-2 w-full rounded"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* CHANNEL */}
        {(formType === "sales" || formType === "return") && (
          <div>
            <label className="block text-sm font-semibold mb-2">Channel</label>
            <select
              className="border px-4 py-2 w-full rounded"
              name="channel"
              value={form.channel}
              onChange={handleChange}
            >
              <option value="">Select Channel</option>
              <option value="retail">Retail</option>
              <option value="online">Online</option>
              <option value="export">Export</option>
            </select>
          </div>
        )}

        {/* RECEIVER */}
        {(formType === "dispatch" ||
          formType === "transfer" ||
          formType === "sample") && (
          <div>
            <label className="block text-sm font-semibold mb-2">Receiver</label>
            <input
              className="border px-4 py-2 w-full rounded"
              name="receiver"
              placeholder="Receiver name"
              value={form.receiver}
              onChange={handleChange}
            />
          </div>
        )}

        {/* SUPPLIER */}
        {formType === "purchase" && (
          <div>
            <label className="block text-sm font-semibold mb-2">Supplier</label>
            <input
              className="border px-4 py-2 w-full rounded"
              name="supplier"
              placeholder="Supplier name"
              value={form.supplier}
              onChange={handleChange}
            />
          </div>
        )}

        {/* TRANSFER TYPE */}
        {formType === "transfer" && (
          <div>
            <label className="block text-sm font-semibold mb-2">Transfer Type</label>
            <select
              className="border px-4 py-2 w-full rounded"
              name="transferType"
              value={form.transferType}
              onChange={handleChange}
            >
              <option value="">Select Type</option>
              <option value="inwards">Inwards</option>
              <option value="outwards">Outwards</option>
            </select>
          </div>
        )}

        {/* PLATFORM (ONLINE) */}
        {warehouseType === "online" && (
          <div>
            <label className="block text-sm font-semibold mb-2">Platform</label>
            <select
              className="border px-4 py-2 w-full rounded"
              name="platform"
              value={form.platform}
              onChange={handleChange}
            >
              <option value="">Select Platform</option>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
              <option value="myntra">Myntra</option>
              <option value="ajio">Ajio</option>
            </select>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={submit}
            className="flex-1 bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
          >
            Save Entry
          </button>
          <Link href="/" className="flex-1">
            <button className="w-full bg-gray-300 text-gray-800 font-semibold py-2 rounded hover:bg-gray-400">
              Cancel
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
