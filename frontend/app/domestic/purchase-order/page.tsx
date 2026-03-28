"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Plus } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { api } from "../../../lib/api";
import { INDIA_CITIES } from "../../../lib/indiaCities";

type PurchaseOrderItem = {
  id: number;
  designNumber: string;
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

export default function PurchaseOrderEntryForm() {
  const [headerInfo, setHeaderInfo] = useState({
    dealerName: "",
    buyerName: "",
    poc: "",
    date: "",
    deadline: "",
    city: "",
  });
  const [existingDealerNames, setExistingDealerNames] = useState<string[]>([]);
  const [existingBuyerNames, setExistingBuyerNames] = useState<string[]>([]);
  const [showDealerSuggestions, setShowDealerSuggestions] = useState(false);
  const [showBuyerSuggestions, setShowBuyerSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isCityDropdownSelected, setIsCityDropdownSelected] = useState(false);
  const [cityValidationError, setCityValidationError] = useState("");
  const dealerInputRef = useRef<HTMLDivElement | null>(null);
  const buyerInputRef = useRef<HTMLDivElement | null>(null);
  const cityInputRef = useRef<HTMLDivElement | null>(null);

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      id: 1,
      designNumber: "",
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
    purchaseOrderValueWords: "Four Thousand Twenty Eight and Forty Four paisa Only",
    gstOutput: 191.84,
    grandTotal: 4028.44,
    termsCondition: "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.",
  });

  const filteredCities = headerInfo.city.trim()
    ? INDIA_CITIES.filter((city) => city.toLowerCase().includes(headerInfo.city.trim().toLowerCase()))
    : [];

  const filteredDealerNames = headerInfo.dealerName.trim()
    ? existingDealerNames.filter((name) => name.toLowerCase().includes(headerInfo.dealerName.trim().toLowerCase()))
    : [];

  const filteredBuyerNames = headerInfo.buyerName.trim()
    ? existingBuyerNames.filter((name) => name.toLowerCase().includes(headerInfo.buyerName.trim().toLowerCase()))
    : [];

  const isCitySelectedFromDropdown = useCallback((cityValue: string) => {
    const normalizedInput = cityValue.trim().toLowerCase();
    return INDIA_CITIES.some((city) => city.toLowerCase() === normalizedInput);
  }, []);

  const normalizeUniqueNames = useCallback((names: string[]) => {
    const uniqueByLower = new Map<string, string>();

    names.forEach((name) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return;
      }

      const key = trimmedName.toLowerCase();
      if (!uniqueByLower.has(key)) {
        uniqueByLower.set(key, trimmedName);
      }
    });

    return Array.from(uniqueByLower.values()).sort((a, b) => a.localeCompare(b));
  }, []);

  const handleHeaderChange = (field: string, value: string) => {
    setHeaderInfo((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    const loadPartySuggestions = async () => {
      try {
        const response = await api.get("/purchase-order");
        const orders = Array.isArray(response.data?.data) ? response.data.data : [];

        const dealerNames = normalizeUniqueNames(
          orders
            .map((order: { dealerName?: string }) => order.dealerName || "")
        );
        const buyerNames = normalizeUniqueNames(
          orders
            .map((order: { buyerName?: string }) => order.buyerName || "")
        );

        setExistingDealerNames(dealerNames);
        setExistingBuyerNames(buyerNames);
      } catch (error) {
        console.error("Failed to load dealer/buyer suggestions:", error);
      }
    };

    loadPartySuggestions();
  }, [normalizeUniqueNames]);

  // Auto-calculate summary based on items
  useEffect(() => {
    const totalQuantity = items.reduce((sum, item) => sum + item.qty, 0);
    const grossTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const gstOutput = items.reduce((sum, item) => sum + item.tax, 0);
    const grandTotal = items.reduce((sum, item) => sum + item.amt, 0);
    const purchaseOrderValueWords = numberToWords(grandTotal);

    setSummary({
      totalQuantity,
      grossTotal: parseFloat(grossTotal.toFixed(2)),
      purchaseOrderValueWords,
      gstOutput: parseFloat(gstOutput.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      termsCondition: "Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged and that there is no flow of additional consideration directly or indirectly from the buyer.",
    });
  }, [items]);

  useEffect(() => {
    if (!showCitySuggestions && !showDealerSuggestions && !showBuyerSuggestions) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dealerInputRef.current && !dealerInputRef.current.contains(target)) {
        setShowDealerSuggestions(false);
      }

      if (buyerInputRef.current && !buyerInputRef.current.contains(target)) {
        setShowBuyerSuggestions(false);
      }

      if (cityInputRef.current && !cityInputRef.current.contains(target)) {
        setShowCitySuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showCitySuggestions, showDealerSuggestions, showBuyerSuggestions]);

  const calculateItemValues = (item: PurchaseOrderItem): PurchaseOrderItem => {
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

  const handleItemChange = (id: number, field: keyof PurchaseOrderItem, value: string | number) => {
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
        designNumber: "",
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

  // Handle Enter key to move to next input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (!form) return;

      const inputs = Array.from(form.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
        'input:not([disabled]):not([readonly]), button:not([disabled])'
      ));
      const currentIndex = inputs.indexOf(e.currentTarget);

      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1]?.focus();
      }
    }
  }, []);

  const handleSaveData = async () => {
    try {
      // Validate required fields
      if (
        !headerInfo.dealerName ||
        !headerInfo.buyerName ||
        !headerInfo.poc ||   // 🔥 THIS LINE
        !headerInfo.date ||
        !headerInfo.city
      ) {
        alert("Please fill all required fields including POC");
        return;
      }

      if (!isCitySelectedFromDropdown(headerInfo.city)) {
        alert("Please select city only from dropdown");
        return;
      }

      if (!isCityDropdownSelected) {
        alert("Please select city from dropdown suggestions");
        return;
      }

      // Filter out empty items (items with no data)
      const validItems = items.filter(item =>
        item.designNumber && item.color && item.qty > 0
      );

      if (validItems.length === 0) {
        alert("Please add at least one valid item with all required fields");
        return;
      }

      // Prepare data for backend
      const purchaseOrderData = {
        dealerName: headerInfo.dealerName,
        buyerName: headerInfo.buyerName,
        poc: headerInfo.poc,
        date: headerInfo.date,
        deadline: headerInfo.deadline,
        city: headerInfo.city,
        items: validItems.map(({ id, ...item }) => item), // Remove the temporary id field
        totalQuantity: summary.totalQuantity,
        grossTotal: summary.grossTotal,
        gstOutput: summary.gstOutput,
        grandTotal: summary.grandTotal,
        termsCondition: summary.termsCondition,
      };

      console.log("Sending purchase order data:", purchaseOrderData);

      // Save to backend
      const response = await api.post("/purchase-order", purchaseOrderData);

      if (response.data.success) {
        alert("Purchase order saved successfully!");
      }
    } catch (error: any) {
      console.error("Error saving purchase order:", error);
      console.error("Error response:", error.response?.data);
      alert(`Failed to save purchase order: ${error.response?.data?.error || error.message}. Still generating PDF and Excel...`);
    }

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title - PURCHASE ORDER
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PURCHASE ORDER", pageWidth / 2, 20, { align: "center" });

    // Header Information Box
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Left side - Consignee (Ship to)
    doc.setFont("helvetica", "bold");
    doc.text("Consignee (Ship to)", 14, 35);
    doc.setFont("helvetica", "normal");
    doc.text(headerInfo.dealerName || "Name of Dealer", 14, 42);
    doc.text(headerInfo.city || "City", 14, 49);

    // Right side - Dated, Mode/Terms of Payment
    doc.setFont("helvetica", "bold");
    doc.text("Voucher No.", pageWidth - 65, 35);
    doc.setFont("helvetica", "normal");
    doc.text(headerInfo.date ? `PO-${headerInfo.date.replace(/-/g, "")}` : "PO-", pageWidth - 65, 42);

    doc.setFont("helvetica", "bold");
    doc.text("Dated", pageWidth - 65, 49);
    doc.setFont("helvetica", "normal");
    doc.text(headerInfo.date || new Date().toLocaleDateString("en-GB"), pageWidth - 65, 56);

    // Buyer Info
    doc.setFont("helvetica", "bold");
    doc.text("Name of Buyer:", 14, 56);
    doc.setFont("helvetica", "normal");
    doc.text(headerInfo.buyerName || "-", 50, 56);

    doc.setFont("helvetica", "bold");
    doc.text("POC:", 14, 63);
    doc.setFont("helvetica", "normal");
    doc.text(headerInfo.poc || "-", 50, 63);

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 69, pageWidth - 14, 69);

    // Items Table
    const tableData = items.map((item, index) => [
      index + 1,
      item.designNumber,
      item.color,
      item.s || "-",
      item.m || "-",
      item.l || "-",
      item.xl || "-",
      item.xxl || "-",
      `${item.xxxl || "-"}`,
      item.qty,
      item.mrp.toFixed(2),
      `${item.dis}%`,
      item.rate.toFixed(2),
      item.amount.toFixed(2),
      `${item.tgst}%`,
      item.tax.toFixed(2),
      item.amt.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 75,
      head: [[
        'SL\\nNo.', 'Description of Goods\\n& HSN/SAC', 'Color', 'S', 'M', 'L', 'XL',
        'XXL', '3XL', 'Quantity', 'Rate\\nper PC', 'Disc\\n%', 'Net\\nRate', 'Amount',
        'GST\\n%', 'Tax', 'Amount\\n(₹)'
      ]],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [71, 85, 105], // Slate color
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 7,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, fontSize: 6 },
        2: { cellWidth: 15 },
        3: { cellWidth: 15 },
        4: { cellWidth: 8, halign: 'center' },
        5: { cellWidth: 8, halign: 'center' },
        6: { cellWidth: 8, halign: 'center' },
        7: { cellWidth: 8, halign: 'center' },
        8: { cellWidth: 8, halign: 'center' },
        9: { cellWidth: 8, halign: 'center' },
        10: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        11: { cellWidth: 13, halign: 'right' },
        12: { cellWidth: 10, halign: 'center' },
        13: { cellWidth: 13, halign: 'right' },
        14: { cellWidth: 15, halign: 'right' },
        15: { cellWidth: 10, halign: 'center' },
        16: { cellWidth: 12, halign: 'right' },
        17: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    let finalY = (doc as any).lastAutoTable?.finalY + 5 || 150;

    // Summary section
    const summaryStartX = pageWidth - 70;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.text("Gross Total:", summaryStartX, finalY);
    doc.text(`₹${summary.grossTotal.toFixed(2)}`, pageWidth - 16, finalY, { align: 'right' });

    finalY += 7;
    doc.text("GST Output:", summaryStartX, finalY);
    doc.text(`₹${summary.gstOutput.toFixed(2)}`, pageWidth - 16, finalY, { align: 'right' });

    finalY += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Grand Total:", summaryStartX, finalY);
    doc.text(`₹${summary.grandTotal.toFixed(2)}`, pageWidth - 16, finalY, { align: 'right' });

    // Total Quantity on left side
    finalY += 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Total Quantity: ${summary.totalQuantity} pcs`, 14, finalY);

    // Amount in words
    finalY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Amount in Words:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const amountWords = doc.splitTextToSize(summary.purchaseOrderValueWords, pageWidth - 28);
    doc.text(amountWords, 14, finalY + 5);

    finalY += 5 + (amountWords.length * 5);

    // Terms and Conditions
    if (finalY + 30 > pageHeight - 20) {
      doc.addPage();
      finalY = 20;
    }

    finalY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Terms & Conditions:", 14, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const termsLines = doc.splitTextToSize(summary.termsCondition, pageWidth - 28);
    doc.text(termsLines, 14, finalY + 6);

    finalY += 6 + (termsLines.length * 4);

    // Footer
    if (finalY > pageHeight - 15) {
      doc.addPage();
      finalY = pageHeight - 15;
    } else {
      finalY = pageHeight - 15;
    }

    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text("This is a Computer Generated Document", pageWidth / 2, finalY, { align: "center" });

    // Download PDF
    doc.save(`purchase_order_${headerInfo.date || new Date().toISOString().split('T')[0]}.pdf`);

    // Excel export with item details
    const excelData = items.map((item, index) => ({
      SL: index + 1,
      "Design Number": item.designNumber,
      Color: item.color,
      S: item.s,
      M: item.m,
      L: item.l,
      XL: item.xl,
      XXL: item.xxl,
      "3XL": item.xxxl,
      "4XL": item.xxxxl,
      "5XL": item.xxxxxl,
      "6XL": item.xxxxxxl,
      QTY: item.qty,
      MRP: item.mrp,
      "DIS%": item.dis,
      Rate: item.rate,
      Amount: item.amount,
      "TGST%": item.tgst,
      Tax: item.tax,
      Total: item.amt,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
    XLSX.writeFile(workbook, `purchase_order_${headerInfo.date || "document"}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <form onSubmit={(e) => e.preventDefault()} className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900">Purchase Order Entry Form</h1>
          <button
            type="button"
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
            Save
          </button>
        </div>

        {/* Header Information Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Header Information</h2>

          <div className="grid text-black grid-cols-1 md:grid-cols-3 gap-6">
            <div ref={dealerInputRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of Dealer
              </label>
              <input
                type="text"
                value={headerInfo.dealerName}
                onChange={(e) => {
                  handleHeaderChange("dealerName", e.target.value);
                  setShowDealerSuggestions(true);
                }}
                onFocus={() => {
                  if (headerInfo.dealerName.trim()) {
                    setShowDealerSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type dealer name"
                autoComplete="off"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />

              {showDealerSuggestions && filteredDealerNames.length > 0 ? (
                <div className="absolute z-20 mt-2 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg" style={{ maxHeight: "220px" }}>
                  {filteredDealerNames.map((dealerName) => (
                    <button
                      key={dealerName}
                      type="button"
                      onMouseDown={() => {
                        handleHeaderChange("dealerName", dealerName);
                        setShowDealerSuggestions(false);
                      }}
                      className="block w-full border-b border-gray-100 px-4 py-2 text-left text-sm text-gray-700 last:border-b-0 hover:bg-blue-50"
                    >
                      {dealerName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div ref={buyerInputRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of Buyer
              </label>
              <input
                type="text"
                value={headerInfo.buyerName}
                onChange={(e) => {
                  handleHeaderChange("buyerName", e.target.value);
                  setShowBuyerSuggestions(true);
                }}
                onFocus={() => {
                  if (headerInfo.buyerName.trim()) {
                    setShowBuyerSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type buyer name"
                autoComplete="off"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />

              {showBuyerSuggestions && filteredBuyerNames.length > 0 ? (
                <div className="absolute z-20 mt-2 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg" style={{ maxHeight: "220px" }}>
                  {filteredBuyerNames.map((buyerName) => (
                    <button
                      key={buyerName}
                      type="button"
                      onMouseDown={() => {
                        handleHeaderChange("buyerName", buyerName);
                        setShowBuyerSuggestions(false);
                      }}
                      className="block w-full border-b border-gray-100 px-4 py-2 text-left text-sm text-gray-700 last:border-b-0 hover:bg-blue-50"
                    >
                      {buyerName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                POC (Point of Contact)
              </label>
              <input
                type="text"
                value={headerInfo.poc}
                onChange={(e) => handleHeaderChange("poc", e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
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
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <input
                type="date"
                value={headerInfo.deadline}
                onChange={(e) => handleHeaderChange("deadline", e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div ref={cityInputRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={headerInfo.city}
                onChange={(e) => {
                  handleHeaderChange("city", e.target.value);
                  setIsCityDropdownSelected(false);
                  setCityValidationError("");
                  setShowCitySuggestions(true);
                }}
                onFocus={() => {
                  if (headerInfo.city.trim()) {
                    setShowCitySuggestions(true);
                  }
                }}
                onBlur={(e) => {
                  const inputCity = e.target.value.trim();
                  if (!inputCity) {
                    setIsCityDropdownSelected(false);
                    setCityValidationError("");
                    return;
                  }

                  const matchedCity = INDIA_CITIES.find((city) => city.toLowerCase() === inputCity.toLowerCase());

                  if (!matchedCity) {
                    handleHeaderChange("city", "");
                    setIsCityDropdownSelected(false);
                    setCityValidationError("Please select a city from dropdown only");
                    return;
                  }

                  handleHeaderChange("city", matchedCity);
                  setIsCityDropdownSelected(false);
                  setCityValidationError("");
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type city name"
                autoComplete="off"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />

              {showCitySuggestions && filteredCities.length > 0 ? (
                <div className="absolute z-20 mt-2 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg" style={{ maxHeight: "220px" }}>
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onMouseDown={() => {
                        handleHeaderChange("city", city);
                        setIsCityDropdownSelected(true);
                        setCityValidationError("");
                        setShowCitySuggestions(false);
                      }}
                      className="block w-full border-b border-gray-100 px-4 py-2 text-left text-sm text-gray-700 last:border-b-0 hover:bg-blue-50"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              ) : null}

              {cityValidationError ? (
                <p className="mt-2 text-xs text-red-600">{cityValidationError}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Items</h2>
            <button
              type="button"
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
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">DESIGN NUMBER</th>
                  <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-50">COLOR</th>
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
                        placeholder="Design Number"
                        value={item.designNumber}
                        onChange={(e) => handleItemChange(item.id, "designNumber", e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </td>
                    <td className="px-3 py-3 text-black">
                      <input
                        type="text"
                        placeholder="Color"
                        value={item.color}
                        onChange={(e) => handleItemChange(item.id, "color", e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.s || ""}
                        onChange={(e) => handleItemChange(item.id, "s", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.m || ""}
                        onChange={(e) => handleItemChange(item.id, "m", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.l || ""}
                        onChange={(e) => handleItemChange(item.id, "l", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xl || ""}
                        onChange={(e) => handleItemChange(item.id, "xl", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxl", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxl", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxxl", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxxxl", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
                        className="w-16 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.xxxxxxl || ""}
                        onChange={(e) => handleItemChange(item.id, "xxxxxxl", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
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
                        onKeyDown={handleKeyDown}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-center"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={item.dis || ""}
                        onChange={(e) => handleItemChange(item.id, "dis", Number(e.target.value))}
                        onKeyDown={handleKeyDown}
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
                        type="button"
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
                  Purchase Order Value (in Words) - Indian Rupees
                </label>
                <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-black text-sm leading-relaxed min-h-[100px]">
                  {summary.purchaseOrderValueWords}
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
            <p className="text-sm italic text-gray-500">This is a Computer Generated Purchase Order</p>
          </div>
        </div>
      </form>
    </div>
  );
}
