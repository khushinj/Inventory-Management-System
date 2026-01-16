"use client";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { api } from "../../lib/api";
import Link from "next/link";

type Domain = "Shop" | "Warehouse";

type FormState = {
  dno: string;
  type: string;
  color: string;
  size: string;
  qty: string;
  date: string;
  channel: string;
  receiver: string;
  supplier: string;
  transferType: string;
  platform: string;
};

type Selection = {
  domain: Domain;
  warehouseType: "domestic" | "export" | "online" | "";
  formType: string;
};

type FieldRules = {
  showChannel: boolean;
  channelOptions?: { value: string; label: string }[];
  showReceiver: boolean;
  receiverLabel?: string;
  receiverOptions?: { value: string; label: string }[];
  showSupplier: boolean;
  showTransferType: boolean;
  transferTypeOptions?: { value: string; label: string }[];
  showPlatform: boolean;
};

const initialForm: FormState = {
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
};

export default function TransactionForm({ selection }: { selection: Selection }) {
  const { domain, warehouseType, formType } = selection;

  const [form, setForm] = useState<FormState>(initialForm);

  useEffect(() => {
    setForm(initialForm);
  }, [domain, warehouseType, formType]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const rules: FieldRules = useMemo(() => {
    if (domain === "shop") {
      return {
        showChannel: true,
        channelOptions: [
          { value: "retail", label: "Retail" },
          { value: "online", label: "Online" },
        ],
        showReceiver: false,
        showSupplier: false,
        showTransferType: false,
        showPlatform: false,
      };
    }

    // Warehouse rules
    if (warehouseType === "domestic" || warehouseType === "export") {
      if (formType === "dispatch") {
        return {
          showChannel: false,
          showReceiver: true,
          receiverLabel: "Receiver",
          showSupplier: false,
          showTransferType: false,
          showPlatform: false,
        };
      }

      if (formType === "production") {
        return {
          showChannel: false,
          showReceiver: false,
          showSupplier: false,
          showTransferType: false,
          showPlatform: false,
        };
      }

      if (formType === "purchase") {
        return {
          showChannel: true,
          channelOptions: [
            { value: "export", label: "Export" },
            { value: "domestic", label: "Domestic" },
            { value: "online", label: "Online" },
          ],
          showReceiver: false,
          showSupplier: true,
          showTransferType: false,
          showPlatform: false,
        };
      }

      if (formType === "transfer") {
        return {
          showChannel: false,
          showReceiver: true,
          receiverLabel: "Receiver",
          receiverOptions: [
            { value: "export", label: "Export" },
            { value: "online", label: "Online" },
          ],
          showSupplier: false,
          showTransferType: true,
          transferTypeOptions: [
            { value: "inwards", label: "Inwards" },
            { value: "outwards", label: "Outwards" },
            { value: "received", label: "Received" },
            { value: "given", label: "Given" },
          ],
          showPlatform: false,
        };
      }

      if (formType === "return") {
        return {
          showChannel: true,
          channelOptions: [
            { value: "export return", label: "Export Return" },
            { value: "domestic return", label: "Domestic Return" },
            { value: "online return", label: "Online Return" },
          ],
          showReceiver: false,
          showSupplier: false,
          showTransferType: false,
          showPlatform: false,
        };
      }

      if (formType === "sample") {
        return {
          showChannel: false,
          showReceiver: true,
          receiverLabel: "Receiver",
          showSupplier: false,
          showTransferType: false,
          showPlatform: false,
        };
      }
    }

    if (warehouseType === "online") {
      if (formType === "return" || formType === "sales") {
        return {
          showChannel: false,
          showReceiver: false,
          showSupplier: false,
          showTransferType: false,
          showPlatform: true,
        };
      }

      if (formType === "transfer") {
        return {
          showChannel: false,
          showReceiver: true,
          receiverLabel: "Receiver",
          showSupplier: false,
          showTransferType: true,
          transferTypeOptions: [
            { value: "inwards", label: "Inwards" },
            { value: "outwards", label: "Outwards" },
          ],
          showPlatform: false,
        };
      }

      if (formType === "purchase") {
        return {
          showChannel: false,
          showReceiver: false,
          showSupplier: true,
          showTransferType: false,
          showPlatform: false,
        };
      }
    }

    return {
      showChannel: false,
      showReceiver: false,
      showSupplier: false,
      showTransferType: false,
      showPlatform: false,
    };
  }, [domain, warehouseType, formType]);

  const submit = async () => {
    if (!form.qty || !form.date) {
      alert("Qty and Date are required");
      return;
    }

    if (rules.showChannel && !form.channel) {
      alert("Channel is required for this form");
      return;
    }

    if (rules.showReceiver && !form.receiver) {
      alert("Receiver is required for this form");
      return;
    }

    if (rules.showSupplier && !form.supplier) {
      alert("Supplier is required for this form");
      return;
    }

    if (rules.showTransferType && !form.transferType) {
      alert("Transfer type is required for this form");
      return;
    }

    if (rules.showPlatform && !form.platform) {
      alert("Platform is required for this form");
      return;
    }

    const endpoint = domain === "shop" ? "/shop" : `/warehouse/${warehouseType}`;

    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === "" ? undefined : value])
    ) as Partial<FormState>;

    try {
      const res = await api.post(endpoint, {
        ...cleanedForm,
        qty: Number(form.qty),
        domain,
        warehouseType: domain === "warehouse" ? warehouseType : undefined,
        formType,
      });

      console.log("Saved:", res.data);
      alert("Saved successfully");
      setForm(initialForm);
    } catch (err: any) {
      console.error("AXIOS ERROR:", err);

      if (err.response) {
        alert(err.response.data.error || "Backend error");
      } else {
        alert("Backend not reachable");
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <Link href="/">
          <button className="text-blue-600 hover:underline mb-4">← Back to Dashboard</button>
        </Link>
        <h2 className="text-2xl font-bold">Create New Entry</h2>
        <p className="text-gray-600">Add a new inventory transaction</p>
      </div>

      <div className=" border rounded-lg p-6 sm:p-8 space-y-4">
        {/* Domain & form context */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Domain</label>
            <input
              className="border px-4 py-2 w-full rounded "
              value={domain}
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Form Type</label>
            <input
              className="border px-4 py-2 w-full rounded capitalize"
              value={formType}
              disabled
            />
          </div>
        </div>

        {domain === "warehouse" && (
          <div>
            <label className="block text-sm font-semibold mb-2">Warehouse Type</label>
            <input
              className="border px-4 py-2 w-full rounded capitalize"
              value={warehouseType}
              disabled
            />
          </div>
        )}

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


        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Channel */}
        {rules.showChannel && (
          <div>
            <label className="block text-sm font-semibold mb-2">Channel *</label>
            <select
              className="border px-4 py-2 w-full rounded"
              name="channel"
              value={form.channel}
              onChange={handleChange}
            >
              <option value="">Select Channel</option>
              {rules.channelOptions?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Receiver */}
        {rules.showReceiver && (
          <div>
            <label className="block text-sm font-semibold mb-2">{rules.receiverLabel || "Receiver"}</label>
            {rules.receiverOptions ? (
              <select
                className="border px-4 py-2 w-full rounded"
                name="receiver"
                value={form.receiver}
                onChange={handleChange}
              >
                <option value="">Select Receiver</option>
                {rules.receiverOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="border px-4 py-2 w-full rounded"
                name="receiver"
                placeholder="Receiver name"
                value={form.receiver}
                onChange={handleChange}
              />
            )}
          </div>
        )}

        {/* Supplier */}
        {rules.showSupplier && (
          <div>
            <label className="block text-sm font-semibold mb-2">Supplier *</label>
            <input
              className="border px-4 py-2 w-full rounded"
              name="supplier"
              placeholder="Supplier name"
              value={form.supplier}
              onChange={handleChange}
            />
          </div>
        )}

        {/* Transfer Type */}
        {rules.showTransferType && (
          <div>
            <label className="block text-sm font-semibold mb-2">Transfer Type *</label>
            <select
              className="border px-4 py-2 w-full rounded"
              name="transferType"
              value={form.transferType}
              onChange={handleChange}
            >
              <option value="">Select Type</option>
              {rules.transferTypeOptions?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Platform */}
        {rules.showPlatform && (
          <div>
            <label className="block text-sm font-semibold mb-2">Platform *</label>
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
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={submit}
            className="flex-1 bg-black text-white font-semibold py-2 rounded hover:bg-blue-700"
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
