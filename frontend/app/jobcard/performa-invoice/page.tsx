"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import * as XLSX from "xlsx";
import { Plus, Save, Trash2, ArrowLeft } from "lucide-react";
import AutocompleteInput from "../../components/AutocompleteInput";
import { ColorInput } from "../../components/ColorInput";
import { api } from "../../../lib/api";

type CuttingEntry = {
  color?: string;
};

type JobCardEntry = {
  designNumber?: string;
  fabric?: string;
  fabricComposition?: string;
  image?: string;
  cutting?: CuttingEntry[];
};

type JobCardOption = {
  designNumber: string;
  fabricDetails: string;
  mrp?: number;
  image?: string;
  colors: string[];
};

type PiItem = {
  id: number;
  designNumber: string;
  picture: string;
  description: string;
  fabricDetails: string;
  color: string;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
  xxxxl: number;
  xxxxxl: number;
  xxxxxxl: number;
  qty: number;
  cost: number;
  totalAmount: number;
};

type PiFooter = {
  ratio: string;
  packingDetails: string;
  suitableQtyInCarton: string;
};

type HeaderState = {
  piNumber: string;
  piDate: string;
  deliveryDate: string;
  priceTerm: string;
  termsOfPayment: string;
  dispatchThrough: string;
  portOfLoading: string;
  portOfDischarge: string;
  preCarriageBy: string;
  countryOfOrigin: string;
  countryOfFinalDestination: string;
  buyerOrderNo: string;
  otherReference: string;
};

const MANUFACTURER_EXPORTER = "VIRGO CLOTHING CULTURE PVT LTD PLOT NO:- 396, EPIP INDUSTRIAL ESTATE, PHASE-3 KUNDLI,SONEPAT,HARYANA - 131208";
const CONSIGNEE_DETAILS = "CONSIGNEE DETAILS TO BE UPDATED";

const initialItem = (id: number): PiItem => ({
  id,
  designNumber: "",
  picture: "",
  description: "",
  fabricDetails: "",
  color: "",
  s: 0,
  m: 0,
  l: 0,
  xl: 0,
  xxl: 0,
  xxxl: 0,
  xxxxl: 0,
  xxxxxl: 0,
  xxxxxxl: 0,
  qty: 0,
  cost: 0,
  totalAmount: 0,
});

const formatDisplayDate = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const buildFabricDetails = (entry: JobCardEntry) => {
  const parts = [entry.fabric?.trim(), entry.fabricComposition?.trim()].filter(Boolean);
  return parts.join(" / ");
};

export default function PerformaInvoicePage() {
  const [header, setHeader] = useState<HeaderState>({
    piNumber: "",
    piDate: "",
    deliveryDate: "",
    priceTerm: "",
    termsOfPayment: "",
    dispatchThrough: "",
    portOfLoading: "",
    portOfDischarge: "",
    preCarriageBy: "",
    countryOfOrigin: "",
    countryOfFinalDestination: "",
    buyerOrderNo: "",
    otherReference: "",
  });
  const [items, setItems] = useState<PiItem[]>([initialItem(1)]);
  const [footer, setFooter] = useState<PiFooter>({
    ratio: "",
    packingDetails: "",
    suitableQtyInCarton: "",
  });
  const [jobCards, setJobCards] = useState<JobCardOption[]>([]);
  const [loadingJobCards, setLoadingJobCards] = useState(true);

  useEffect(() => {
    const loadJobCards = async () => {
      try {
        const response = await api.get("/jobcard");
        const jobCardEntries: JobCardEntry[] = Array.isArray(response.data) ? response.data : [];
        const optionMap = new Map<string, JobCardOption>();

        jobCardEntries.forEach((entry) => {
          const designNumber = String(entry.designNumber || "").trim();
          if (!designNumber) return;

          const key = designNumber.toLowerCase();
          const fabricDetails = buildFabricDetails(entry);
          const colors = Array.isArray(entry.cutting)
            ? entry.cutting.map((cut) => String(cut.color || "").trim()).filter(Boolean)
            : [];

            if (!optionMap.has(key)) {
              optionMap.set(key, {
                designNumber,
                fabricDetails,
                mrp: Number((entry as any).mrp) || 0,
                image: entry.image || "",
                colors,
              });
            return;
          }

          const existing = optionMap.get(key)!;
          if (!existing.fabricDetails && fabricDetails) {
            existing.fabricDetails = fabricDetails;
          }
          if (!existing.image && entry.image) {
            existing.image = entry.image;
          }

          colors.forEach((color) => {
            if (!existing.colors.some((existingColor) => existingColor.toLowerCase() === color.toLowerCase())) {
              existing.colors.push(color);
            }
          });
        });

        setJobCards(
          Array.from(optionMap.values())
            .map((option) => ({
              ...option,
              colors: [...option.colors].sort((left, right) => left.localeCompare(right)),
            }))
            .sort((left, right) => left.designNumber.localeCompare(right.designNumber))
        );
      } catch (error) {
        console.error("Failed to load job cards for PI:", error);
        setJobCards([]);
      } finally {
        setLoadingJobCards(false);
      }
    };

    loadJobCards();
  }, []);

  const filteredJobCards = useMemo(() => jobCards, [jobCards]);

  const updateHeader = (field: keyof HeaderState, value: string) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  const calculateItem = (item: PiItem): PiItem => {
    const qty = item.s + item.m + item.l + item.xl + item.xxl + item.xxxl + item.xxxxl + item.xxxxxl + item.xxxxxxl;
    const totalAmount = qty * (Number(item.cost) || 0);

    return {
      ...item,
      qty,
      totalAmount: Number(totalAmount.toFixed(2)),
    };
  };

  const updateItem = (id: number, field: keyof PiItem, value: string | number) => {
    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value } as PiItem;
        return calculateItem(updated);
      })
    );
  };

  const handleDesignNumberChange = (id: number, designNumber: string) => {
    const selectedJobCard = jobCards.find(
      (jobCard) => jobCard.designNumber.toLowerCase() === designNumber.trim().toLowerCase()
    );

    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) return item;

        const nextItem = {
          ...item,
          designNumber,
          picture: selectedJobCard?.image || "",
          fabricDetails: selectedJobCard?.fabricDetails || item.fabricDetails,
          color: selectedJobCard?.colors?.[0] || item.color,
          cost: selectedJobCard?.mrp || item.cost,
        };

        return calculateItem(nextItem);
      })
    );
  };

  const addRow = () => {
    const nextId = Math.max(...items.map((item) => item.id), 0) + 1;
    setItems((previous) => [...previous, initialItem(nextId)]);
  };

  const removeRow = (id: number) => {
    setItems((previous) => (previous.length > 1 ? previous.filter((item) => item.id !== id) : previous));
  };

  const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);

  const selectedJobCardColors = (designNumber: string) => {
    const selected = jobCards.find(
      (jobCard) => jobCard.designNumber.toLowerCase() === designNumber.trim().toLowerCase()
    );
    return selected?.colors || [];
  };

  const downloadExcel = () => {
    if (!header.piNumber.trim() || !header.piDate || !header.deliveryDate) {
      alert("Please fill PI number, PI date, and delivery date before downloading.");
      return;
    }

    const validItems = items.filter((item) => item.designNumber.trim() || item.qty > 0 || item.cost > 0);

    if (validItems.length === 0) {
      alert("Please add at least one PI item before downloading.");
      return;
    }

    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      ["PERFORMA INVOICE"],
      ["Manufacturer/Exporter", MANUFACTURER_EXPORTER],
      ["PI Number", header.piNumber],
      ["PI Date", formatDisplayDate(header.piDate)],
      ["Delivery Date", formatDisplayDate(header.deliveryDate)],
      ["Price Term", header.priceTerm],
      ["Terms of Payment", header.termsOfPayment],
      ["Dispatch Through", header.dispatchThrough],
      ["Port of Loading", header.portOfLoading],
      ["Port of Discharge", header.portOfDischarge],
      ["Pre-Carriage By", header.preCarriageBy],
      ["Country of Origin of the Goods", header.countryOfOrigin],
      ["Country of Final Destination", header.countryOfFinalDestination],
      ["Buyer Order No", header.buyerOrderNo],
      ["Other Reference", header.otherReference],
      ["Consignee", CONSIGNEE_DETAILS],
      [""],
      ["Items"],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.sheet_add_aoa(summarySheet, [[
      "SL",
      "Design Number",
      "Picture",
      "Description",
      "Fabric Details",
      "Color",
      "S",
      "M",
      "L",
      "XL",
      "XXL",
      "3XL",
      "4XL",
      "5XL",
      "6XL",
      "Total Qty",
      "Cost",
      "Total Amount",
    ]], { origin: { r: summaryRows.length, c: 0 } });

    validItems.forEach((item, index) => {
      XLSX.utils.sheet_add_aoa(
        summarySheet,
        [[
          index + 1,
          item.designNumber,
          item.picture,
          item.description,
          item.fabricDetails,
          item.color,
          item.s || "",
          item.m || "",
          item.l || "",
          item.xl || "",
          item.xxl || "",
          item.xxxl || "",
          item.xxxxl || "",
          item.xxxxxl || "",
          item.xxxxxxl || "",
          item.qty,
          item.cost,
          item.totalAmount,
        ]],
        { origin: { r: summaryRows.length + 1 + index, c: 0 } }
      );
    });

    XLSX.utils.sheet_add_aoa(summarySheet, [["Total Quantity", totalQuantity], ["Grand Total", totalAmount]], {
      origin: { r: summaryRows.length + 1 + validItems.length + 2, c: 0 },
    });

    XLSX.utils.sheet_add_aoa(
      summarySheet,
      [["PI Details"], ["Ratio", footer.ratio], ["Packing Details", footer.packingDetails], ["Suitable Qty In Carton Of Solid Color", footer.suitableQtyInCarton]],
      { origin: { r: summaryRows.length + 1 + validItems.length + 6, c: 0 } }
    );

    summarySheet["!cols"] = [
      { wch: 12 },
      { wch: 28 },
      { wch: 35 },
      { wch: 24 },
      { wch: 22 },
      { wch: 16 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, "PI");
    XLSX.writeFile(workbook, `performa_invoice_${header.piNumber || header.piDate || "document"}.xlsx`);
  };

  const handleSave = async () => {
    try {
      if (!header.piNumber.trim() || !header.piDate || !header.deliveryDate) {
        alert("Please fill PI number, PI date, and delivery date before saving.");
        return;
      }

      const validItems = items.filter((item) => item.designNumber.trim() || item.qty > 0 || item.cost > 0);
      if (validItems.length === 0) {
        alert("Please add at least one PI item before saving.");
        return;
      }

      const payload = {
        header,
        items: validItems,
        footer,
        totalQuantity,
        totalAmount,
      };

      await api.post("/performa-invoice", payload);

      // After successful save, trigger Excel download
      downloadExcel();
    } catch (err: any) {
      console.error("Failed to save PI:", err);
      alert("Failed to save PI. See console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Performa Invoice</h1>
              <p className="mt-1 text-indigo-100">Create PI entries linked to job cards and download Excel only.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/jobcard-forms"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Job Card Hub
              </Link>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-900"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">PI Header</h2>
              <p className="text-sm text-gray-600">Manufacturer and consignee stay fixed. Everything else can be entered as needed.</p>
            </div>
            <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Job card matches: {loadingJobCards ? "Loading..." : filteredJobCards.length}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 md:col-span-2 xl:col-span-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Manufacturer / Exporter</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{MANUFACTURER_EXPORTER}</p>
            </div>

            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">PI Number <span className="text-xs text-gray-500">(required)</span></label>
              <input
                type="text"
                value={header.piNumber}
                onChange={(event) => updateHeader("piNumber", event.target.value)}
                placeholder="Enter PI number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">PI Date <span className="text-xs text-gray-500">(required)</span></label>
              <input
                type="date"
                value={header.piDate}
                onChange={(event) => updateHeader("piDate", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Delivery Date <span className="text-xs text-gray-500">(required)</span></label>
              <input
                type="date"
                value={header.deliveryDate}
                onChange={(event) => updateHeader("deliveryDate", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Buyer Order No</label>
              <input
                type="number"
                value={header.buyerOrderNo}
                onChange={(event) => updateHeader("buyerOrderNo", event.target.value)}
                placeholder="Numeric order no"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {([
              ["priceTerm", "Price Term"],
              ["termsOfPayment", "Terms of Payment"],
              ["dispatchThrough", "Dispatch Through"],
              ["portOfLoading", "Port of Loading"],
              ["portOfDischarge", "Port of Discharge"],
              ["preCarriageBy", "Pre-Carriage By"],
              ["countryOfOrigin", "Country of Origin of the Goods"],
              ["countryOfFinalDestination", "Country of Final Destination"],
              ["otherReference", "Other Reference"],
            ] as Array<[keyof HeaderState, string]>).map(([field, label]) => (
              <div key={field}>
                <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
                <input
                  type="text"
                  value={header[field]}
                  onChange={(event) => updateHeader(field, event.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}`}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Consignee</p>
            <p className="mt-2 whitespace-pre-line text-lg font-semibold text-gray-900">{CONSIGNEE_DETAILS}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">PI Items</h2>
              <p className="text-sm text-gray-600">Select design numbers from job cards to pull image, fabric, and colors.</p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1700px] w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300 bg-gray-50 text-left text-sm font-semibold text-gray-900">
                  <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3">SL</th>
                  <th className="px-3 py-3">Design Number</th>
                  <th className="px-3 py-3">Picture</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3">Fabric Details</th>
                  <th className="px-3 py-3">Color</th>
                  <th className="px-3 py-3 text-center">S</th>
                  <th className="px-3 py-3 text-center">M</th>
                  <th className="px-3 py-3 text-center">L</th>
                  <th className="px-3 py-3 text-center">XL</th>
                  <th className="px-3 py-3 text-center">XXL</th>
                  <th className="px-3 py-3 text-center">3XL</th>
                  <th className="px-3 py-3 text-center">4XL</th>
                  <th className="px-3 py-3 text-center">5XL</th>
                  <th className="px-3 py-3 text-center">6XL</th>
                  <th className="px-3 py-3 text-center">Total Qty</th>
                  <th className="px-3 py-3 text-center">Cost</th>
                  <th className="px-3 py-3 text-center">Total Amt</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-200 align-top text-gray-900 hover:bg-gray-50">
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 text-sm font-semibold">{index + 1}</td>
                    <td className="px-3 py-3">
                        <AutocompleteInput
                          value={item.designNumber}
                          onChange={(val) => handleDesignNumberChange(item.id, val)}
                          onSelect={(val) => handleDesignNumberChange(item.id, val)}
                          options={filteredJobCards.map((o) => o.designNumber)}
                          placeholder="Type or select design"
                          className="w-44 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
                        />
                    </td>
                    <td className="px-3 py-3">
                      {item.picture ? (
                        <div className="flex flex-col gap-2">
                          <Image
                            src={item.picture}
                            alt={`${item.designNumber || "PI"} preview`}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                          />
                          <span className="text-[11px] text-gray-500">From jobcard</span>
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-[11px] text-gray-500">
                          No image
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(event) => updateItem(item.id, "description", event.target.value)}
                        placeholder="Optional description"
                        className="w-44 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={item.fabricDetails}
                        onChange={(event) => updateItem(item.id, "fabricDetails", event.target.value)}
                        placeholder="Fabric details"
                        className="w-48 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <ColorInput
                        value={item.color}
                        onChange={(val) => updateItem(item.id, "color", val)}
                        onKeyDown={undefined}
                        colorOptions={selectedJobCardColors(item.designNumber).map((c) => ({ color: c, quantity: 0 }))}
                        hasJobCard={selectedJobCardColors(item.designNumber).length > 0}
                        placeholder="Color"
                        className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none"
                      />
                    </td>
                    {(["s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl", "xxxxxxl"] as Array<keyof PiItem>).map((sizeField) => (
                      <td key={sizeField} className="px-3 py-3 text-center">
                        <input
                          type="number"
                          value={item[sizeField] || ""}
                          onChange={(event) => updateItem(item.id, sizeField, Number(event.target.value))}
                          className="w-16 rounded-md border border-gray-300 px-2 py-2 text-center text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-center">
                      <div className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                        {item.qty}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        value={item.cost || ""}
                        onChange={(event) => updateItem(item.id, "cost", Number(event.target.value))}
                        min="0"
                        step="0.01"
                        placeholder="Cost"
                        className="w-24 rounded-md border border-gray-300 px-2 py-2 text-center text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                        {formatNumber(item.totalAmount)}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(item.id)}
                        className="inline-flex items-center justify-center rounded-md p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                        title="Delete row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <datalist id="pi-jobcard-design-options">
              {filteredJobCards.map((option) => (
                <option key={option.designNumber} value={option.designNumber} />
              ))}
            </datalist>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">Total Quantity</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{totalQuantity}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">Total Amount</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{formatNumber(totalAmount)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700">Rows</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">PI Details</h3>
            <p className="mt-1 text-sm text-gray-600">Enter ratio and packing details here instead of inside each row.</p>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Ratio</label>
                <input
                  type="text"
                  value={footer.ratio}
                  onChange={(event) => setFooter((previous) => ({ ...previous, ratio: event.target.value }))}
                  placeholder="Enter ratio"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Packing Details</label>
                <input
                  type="text"
                  value={footer.packingDetails}
                  onChange={(event) => setFooter((previous) => ({ ...previous, packingDetails: event.target.value }))}
                  placeholder="Enter packing details"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Suitable Qty In Carton Of Solid Color</label>
                <input
                  type="text"
                  value={footer.suitableQtyInCarton}
                  onChange={(event) => setFooter((previous) => ({ ...previous, suitableQtyInCarton: event.target.value }))}
                  placeholder="Enter quantity"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}