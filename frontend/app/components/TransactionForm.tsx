"use client";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { api } from "../../lib/api";
import Link from "next/link";
import axios from "axios";

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

export default function TransactionForm({ 
  selection,
  onFormTypeChange 
}: { 
  selection: Selection;
  onFormTypeChange: (formType: string) => void;
}) {
  const { domain, warehouseType, formType } = selection;

  const [form, setForm] = useState<FormState>(initialForm);

  const inputRefs = useRef<Record<keyof FormState, HTMLInputElement | HTMLSelectElement | null>>({
    dno: null,
    type: null,
    color: null,
    size: null,
    qty: null,
    date: null,
    channel: null,
    receiver: null,
    supplier: null,
    transferType: null,
    platform: null,
  });

  const fieldOrder: (keyof FormState)[] = [
    "dno",
    "type",
    "color",
    "size",
    "qty",
    "date",
    "channel",
    "receiver",
    "supplier",
    "transferType",
    "platform",
  ];

  useEffect(() => {
    setForm(initialForm);
  }, [domain, warehouseType, formType]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const rules: FieldRules = useMemo(() => {
    if (domain === "Shop") {
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

    const endpoint = domain === "Shop" ? "/shop" : `/warehouse/${warehouseType}`;

    const cleanedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === "" ? undefined : value])
    ) as Partial<FormState>;

    try {
      const res = await api.post(endpoint, {
        ...cleanedForm,
        qty: Number(form.qty),
        domain: domain === "Shop" ? "shop" : "warehouse",
        warehouseType: domain === "Warehouse" ? warehouseType : undefined,
        formType,
      });

      console.log("Saved:", res.data);
      alert("Saved successfully");
      setForm(initialForm);
    } catch (err: unknown) {
      console.error("AXIOS ERROR:", err);

      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.error || "Backend error");
      } else {
        alert("Backend not reachable");
      }
    }
  };

  const isFieldVisible = (field: keyof FormState) => {
    if (field === "channel") return rules.showChannel;
    if (field === "receiver") return rules.showReceiver;
    if (field === "supplier") return rules.showSupplier;
    if (field === "transferType") return rules.showTransferType;
    if (field === "platform") return rules.showPlatform;
    return true;
  };

  const handleEnterFocus = (field: keyof FormState) => (
    e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const visibleFields = fieldOrder.filter(isFieldVisible);
    const index = visibleFields.indexOf(field);
    if (index === -1) return;
    const nextField = visibleFields.slice(index + 1).find((f) => inputRefs.current[f]);
    if (nextField) {
      inputRefs.current[nextField]?.focus();
    }
  };

  // Get available form types based on domain and warehouse type
  const getFormTypeButtons = () => {
    if (domain === "Shop") {
      return [
        { value: "import", label: "Import" },
        { value: "sales", label: "Sales / Return" },
      ];
    }

    if (warehouseType === "domestic" || warehouseType === "export") {
      const buttons = [
        { value: "dispatch", label: "Dispatch" },
        { value: "production", label: "Production" },
        { value: "purchase", label: "Purchase" },
        { value: "transfer", label: "Transfer" },
      ];
      if (warehouseType === "domestic") {
        buttons.push(
          { value: "return", label: "Return" },
          { value: "sample", label: "Sample" }
        );
      }
      return buttons;
    }

    if (warehouseType === "online") {
      return [
        { value: "return", label: "Return" },
        { value: "sales", label: "Sales" },
        { value: "transfer", label: "Transfer" },
        { value: "purchase", label: "Purchase" },
      ];
    }

    return [];
  };

  const formTypeButtons = getFormTypeButtons();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <Link href="/">
          <button className="text-blue-600 hover:underline mb-4">← Back to Dashboard</button>
        </Link>
        <h2 className="text-2xl font-bold">Create New Entry</h2>
        <p className="text-gray-600">Add a new inventory transaction</p>
      </div>

      {/* Form Type Buttons */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Select Form Type</h3>
        <div className="flex flex-wrap gap-3">
          {formTypeButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => onFormTypeChange(btn.value)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                formType === btn.value
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className=" border rounded-lg p-6 sm:p-8 space-y-4">

        {/* Design Number */}
        <div>
          <label className="block text-sm font-semibold mb-2">Design Number (DNO)</label>
          <input
            className="border px-4 py-2 w-full rounded"
            name="dno"
            placeholder="e.g., D001"
            value={form.dno}
            onChange={handleChange}
            onKeyDown={handleEnterFocus("dno")}
            ref={(el) => {inputRefs.current.dno = el;}}
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
            onKeyDown={handleEnterFocus("type")}
            ref={(el) => {inputRefs.current.type = el;}}
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
              onKeyDown={handleEnterFocus("color")}
              ref={(el) => {inputRefs.current.color = el;}}
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
              onKeyDown={handleEnterFocus("size")}
              ref={(el) => {inputRefs.current.size = el;}}
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
              onKeyDown={handleEnterFocus("qty")}
              ref={(el) => {inputRefs.current.qty = el;}}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Date *</label>
            <input
              className="border px-4 py-2 w-full text-black bg-white rounded"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              onKeyDown={handleEnterFocus("date")}
              ref={(el) => {inputRefs.current.date = el;}}
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
              onKeyDown={handleEnterFocus("channel")}
              ref={(el) => {inputRefs.current.channel = el;}}
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
                className="border px-4 py-2 w-full rounded bg-black"
                name="receiver"
                value={form.receiver}
                onChange={handleChange}
                onKeyDown={handleEnterFocus("receiver")}
                ref={(el) => {inputRefs.current.receiver = el;}}
              >
                <option value="" >Select Receiver</option>
                {rules.receiverOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="hover:text-black">
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
                onKeyDown={handleEnterFocus("receiver")}
                ref={(el) => {inputRefs.current.receiver = el;}}
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
              onKeyDown={handleEnterFocus("supplier")}
              ref={(el) => {inputRefs.current.supplier = el;}}
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
              onKeyDown={handleEnterFocus("transferType")}
              ref={(el) => {inputRefs.current.transferType = el;}}
            >
              <option value="" className="text-white">Select Type</option>
              {rules.transferTypeOptions?.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-black hover:text-black">
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
              onKeyDown={handleEnterFocus("platform")}
              ref={(el) => {inputRefs.current.platform = el;}}
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
