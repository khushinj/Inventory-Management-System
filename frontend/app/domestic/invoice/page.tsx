"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

type InvoiceItem = {
  id: number;
  category: string;
  itemName: string;
  color: string;
  hsn: string;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
  xxxxl: number;
  xxxxxl: number;
};

export default function InvoiceDataEntryForm() {
  const [headerInfo, setHeaderInfo] = useState({
    gstinUin: "07AAECC7749M2Z2",
    stateName: "Delhi, Code - 07",
    challanInvoiceNo: "",
    date: "",
    cityPortLoading: "",
    eWayBill: "",
    cityPortDischarge: "",
    termsOfDelivery: "",
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      category: "",
      itemName: "",
      color: "",
      hsn: "",
      s: 0,
      m: 0,
      l: 0,
      xl: 0,
      xxl: 0,
      xxxl: 0,
      xxxxl: 0,
      xxxxxl: 0,
    },
  ]);

  const [summary, setSummary] = useState({
    totalQuantity: 4,
    grossTotal: 3836.60,
    invoiceValueWords: "Four Thousand Twenty Eight and Forty Four paisa Only",
    igstOutput: 191.84,
    grandTotal: 4028.44,
    termsCondition: "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.",
  });

  const handleHeaderChange = (field: string, value: string) => {
    setHeaderInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addRow = () => {
    const newId = Math.max(...items.map((item) => item.id), 0) + 1;
    setItems([
      ...items,
      {
        id: newId,
        category: "",
        itemName: "",
        color: "",
        hsn: "",
        s: 0,
        m: 0,
        l: 0,
        xl: 0,
        xxl: 0,
        xxxl: 0,
        xxxxl: 0,
        xxxxxl: 0,
      },
    ]);
  };

  const handleSaveData = () => {
    const invoiceData = {
      header: headerInfo,
      items: items,
      summary: summary,
    };
    console.log("Saving invoice data:", invoiceData);
    // Add API call here to save the data
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Invoice Data Entry Form</h1>
          <button
            onClick={handleSaveData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save Data
          </button>
        </div>

        {/* Header Information Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Header Information</h2>
          
          <div className="grid text-black grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Row 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GSTIN/UIN
              </label>
              <input
                type="text"
                placeholder={headerInfo.gstinUin}
                onChange={(e) => handleHeaderChange("gstinUin", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State Name
              </label>
              <input
                type="text"
                placeholder={headerInfo.stateName}
                onChange={(e) => handleHeaderChange("stateName", e.target.value)}
                className="w-full text-black px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Challan/Invoice No
              </label>
              <input
                type="text"
                value={headerInfo.challanInvoiceNo}
                onChange={(e) => handleHeaderChange("challanInvoiceNo", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="text"
                placeholder="dd-mm-yyyy"
                value={headerInfo.date}
                onChange={(e) => handleHeaderChange("date", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Port of Loading
              </label>
              <input
                type="text"
                value={headerInfo.cityPortLoading}
                onChange={(e) => handleHeaderChange("cityPortLoading", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-way Bill
              </label>
              <input
                type="text"
                value={headerInfo.eWayBill}
                onChange={(e) => handleHeaderChange("eWayBill", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City/Port of Discharge
              </label>
              <input
                type="text"
                value={headerInfo.cityPortDischarge}
                onChange={(e) => handleHeaderChange("cityPortDischarge", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms Of Delivery
              </label>
              <input
                type="text"
                value={headerInfo.termsOfDelivery}
                onChange={(e) => handleHeaderChange("termsOfDelivery", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Items</h2>
            <button
              onClick={addRow}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">SL</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">CATEGORY</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">ITEM NAME</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">COLOR</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">HSN</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">S</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">M</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">L</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">XL</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">XXL</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">3XL</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">4XL</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">5XL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 text-black">
                    <td className="px-3 py-3 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        placeholder="Category"
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        placeholder="Item Name"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(item.id, "itemName", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-black">
                      <input
                        type="text"
                        placeholder="Color"
                        value={item.color}
                        onChange={(e) => handleItemChange(item.id, "color", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        placeholder="H"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(item.id, "hsn", e.target.value)}
                        className="w-16 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.s || ""}
                        onChange={(e) => handleItemChange(item.id, "s", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.m || ""}
                        onChange={(e) => handleItemChange(item.id, "m", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.l || ""}
                        onChange={(e) => handleItemChange(item.id, "l", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xl || ""}
                        onChange={(e) => handleItemChange(item.id, "xl", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxl", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxl", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxxl", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxxxl", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary & Terms Section */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-black mb-6">Summary & Terms</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Quantity
                </label>
                <input
                  type="number"
                  value={summary.totalQuantity}
                  onChange={(e) => setSummary({ ...summary, totalQuantity: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Value (in Words) - Indian Rupees
                </label>
                <textarea
                  value={summary.invoiceValueWords}
                  onChange={(e) => setSummary({ ...summary, invoiceValueWords: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Condition - E.A.O.E
                </label>
                <textarea
                  value={summary.termsCondition}
                  onChange={(e) => setSummary({ ...summary, termsCondition: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gross Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={summary.grossTotal}
                  onChange={(e) => setSummary({ ...summary, grossTotal: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IGST OUTPUT
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={summary.igstOutput}
                  onChange={(e) => setSummary({ ...summary, igstOutput: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grand Total
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={summary.grandTotal}
                  onChange={(e) => setSummary({ ...summary, grandTotal: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <div className="mt-8 text-center">
            <p className="text-sm italic text-gray-500">This is a Computer Generated Invoice</p>
          </div>
        </div>
      </div>
    </div>
  );
}
