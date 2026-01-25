"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  xxxxxxl: number;
  qty: number;
  mrp: number;
  dis: number;
  rate: number;
  amount: number;
  tgst: number;
  tax: number;
  amt: number;
};

// Function to convert number to words (Indian Rupees)
function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }
  
  let rupees = Math.floor(num);
  const paise = Math.round((num - Math.floor(num)) * 100);
  
  let result = "";
  
  // Convert rupees part
  if (rupees >= 10000000) { // Crores
    result += convertLessThanThousand(Math.floor(rupees / 10000000)) + " Crore ";
    rupees %= 10000000;
  }
  if (rupees >= 100000) { // Lakhs
    result += convertLessThanThousand(Math.floor(rupees / 100000)) + " Lakh ";
    rupees %= 100000;
  }
  if (rupees >= 1000) { // Thousands
    result += convertLessThanThousand(Math.floor(rupees / 1000)) + " Thousand ";
    rupees %= 1000;
  }
  if (rupees > 0) {
    result += convertLessThanThousand(rupees);
  }
  
  result = result.trim();
  
  if (paise > 0) {
    result += " and " + convertLessThanThousand(paise) + " Paisa";
  }
  
  return result + " Only";
}

export default function InvoiceDataEntryForm() {
  const [headerInfo, setHeaderInfo] = useState({
    buyerName: "",
    date: "",
    city: "",
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
      xxxxxxl: 0,
      qty: 0,
      mrp: 0,
      dis: 0,
      rate: 0,
      amount: 0,
      tgst: 0,
      tax: 0,
      amt: 0,
    },
  ]);

  const [summary, setSummary] = useState({
    totalQuantity: 4,
    grossTotal: 3836.60,
    invoiceValueWords: "Four Thousand Twenty Eight and Forty Four paisa Only",
    gstOutput: 191.84,
    grandTotal: 4028.44,
    termsCondition: "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.",
  });

  const handleHeaderChange = (field: string, value: string) => {
    setHeaderInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Auto-calculate summary based on items
  useEffect(() => {
    const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
    const grossTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstOutput = items.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = items.reduce((sum, item) => sum + item.amt, 0);
    const invoiceValueWords = numberToWords(grandTotal);

    setSummary({
      totalQuantity,
      grossTotal: parseFloat(grossTotal.toFixed(2)),
      invoiceValueWords,
      gstOutput: parseFloat(gstOutput.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      termsCondition: "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.",
    });
  }, [items]);

  const calculateItemValues = (item: InvoiceItem): InvoiceItem => {
    // Calculate QTY: sum of all sizes
    const qty = item.s + item.m + item.l + item.xl + item.xxl + item.xxxl + item.xxxxl + item.xxxxxl + item.xxxxxxl;
    
    // Calculate RATE: MRP - (MRP * discount%)
    const rate = item.mrp - (item.mrp * item.dis / 100);
    
    // Calculate AMOUNT: RATE * QTY
    const amount = rate * qty;
    
    // Calculate TGST %: 5% if MRP < 2500, 18% if MRP >= 2500
    const tgst = item.mrp > 0 ? (item.mrp < 2500 ? 5 : 18) : 0;
    
    // Calculate TAX: AMOUNT * (TGST / 100)
    const tax = amount * (tgst / 100);
    
    // Calculate AMT: AMOUNT + TAX (total payable)
    const amt = amount + tax;
    
    return {
      ...item,
      qty,
      rate: parseFloat(rate.toFixed(2)),
      amount: parseFloat(amount.toFixed(2)),
      tgst,
      tax: parseFloat(tax.toFixed(2)),
      amt: parseFloat(amt.toFixed(2)),
    };
  };

  const handleItemChange = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          return calculateItemValues(updatedItem);
        }
        return item;
      })
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
        xxxxxxl: 0,
        qty: 0,
        mrp: 0,
        dis: 0,
        rate: 0,
        amount: 0,
        tgst: 0,
        tax: 0,
        amt: 0,
      },
    ]);
  };

  const handleSaveData = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    // Header Information
    doc.setFontSize(10);
    doc.text(`Buyer Name: ${headerInfo.buyerName}`, 20, 35);
    doc.text(`Date: ${headerInfo.date}`, 20, 42);
    doc.text(`City: ${headerInfo.city}`, 20, 49);
    
    // Items Table
    const tableData = items.map((item, index) => [
      index + 1,
      item.category,
      item.itemName,
      item.color,
      item.hsn,
      item.s,
      item.m,
      item.l,
      item.xl,
      item.xxl,
      item.xxxl,
      item.xxxxl,
      item.xxxxxl,
      item.xxxxxxl,
      item.qty,
      item.mrp.toFixed(2),
      item.dis,
      item.rate.toFixed(2),
      item.amount.toFixed(2),
      `${item.tgst}%`,
      item.tax.toFixed(2),
      item.amt.toFixed(2),
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [[
        'SL', 'Category', 'Item', 'Color', 'HSN', 'S', 'M', 'L', 'XL', 'XXL', 
        '3XL', '4XL', '5XL', '6XL', 'QTY', 'MRP', 'DIS%', 'Rate', 'Amt', 'TGST%', 'Tax', 'Total'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 12 },
        4: { cellWidth: 12 },
      },
    });
    
    // Terms and Conditions
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text('Terms & Conditions:', 20, finalY);
    doc.setFontSize(8);
    const termsLines = doc.splitTextToSize(summary.termsCondition, 170);
    doc.text(termsLines, 20, finalY + 7);
    
    // Download PDF
    doc.save(`invoice_${headerInfo.date || 'document'}.pdf`);
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
          
          <div className="grid text-black grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of Buyer
              </label>
              <input
                type="text"
                value={headerInfo.buyerName}
                onChange={(e) => handleHeaderChange("buyerName", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={headerInfo.date}
                onChange={(e) => handleHeaderChange("date", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={headerInfo.city}
                onChange={(e) => handleHeaderChange("city", e.target.value)}
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

          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50 sticky left-0 z-10">SL</th>
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
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">6XL</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">QTY</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">MRP</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">DIS</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">RATE</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">AMOUNT</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">TGST %</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">TAX</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">AMT</th>
                  <th className="px-3 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-50">Actions</th>
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
                        placeholder="HSN"
                        value={item.hsn}
                        onChange={(e) => handleItemChange(item.id, "hsn", e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
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
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxxxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxxxxl", Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-20 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center text-gray-700 font-medium">{item.qty}</div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.mrp || ""}
                        onChange={(e) => handleItemChange(item.id, "mrp", Number(e.target.value))}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.dis || ""}
                        onChange={(e) => handleItemChange(item.id, "dis", Number(e.target.value))}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                        placeholder="%"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-20 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center text-gray-700 font-medium">{item.rate.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-20 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center text-gray-700 font-medium">{item.amount.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-20 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center text-gray-700 font-medium">{item.tgst}%</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-20 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center text-gray-700 font-medium">{item.tax.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="w-20 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-center text-gray-700 font-medium">{item.amt.toFixed(2)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setItems(items.filter((i) => i.id !== item.id))}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
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
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-medium">
                  {summary.totalQuantity}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Value (in Words) - Indian Rupees
                </label>
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-black text-sm leading-relaxed min-h-[100px]">
                  {summary.invoiceValueWords}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Condition - E.A.O.E
                </label>
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-black text-sm leading-relaxed min-h-[150px]">
                  {summary.termsCondition}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gross Total
                </label>
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-medium">
                  ₹{summary.grossTotal.toFixed(2)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST OUTPUT
                </label>
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-medium">
                  ₹{summary.gstOutput.toFixed(2)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grand Total
                </label>
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-900 font-bold text-lg">
                  ₹{summary.grandTotal.toFixed(2)}
                </div>
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
