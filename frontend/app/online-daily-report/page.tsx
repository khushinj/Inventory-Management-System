"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import * as XLSX from "xlsx";

interface OnlineDailyReport {
  _id: string;
  date: string;
  // Platform Quantities
  myntraQty: number;
  ajioQty: number;
  amazonQty: number;
  flipkartQty: number;
  snapdealQty: number;
  websiteQty: number;
  totalQuantity: number;
  // Platform Returns
  myntraPrice: number;
  ajioPrice: number;
  amazonPrice: number;
  flipkartPrice: number;
  snapdealPrice: number;
  websitePrice: number;
  // Amount Received per Platform
  myntraAmountReceived: number;
  ajioAmountReceived: number;
  amazonAmountReceived: number;
  flipkartAmountReceived: number;
  snapdealAmountReceived: number;
  websiteAmountReceived: number;
}

export default function OnlineDailyReportPage() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    // Platform Quantities
    myntraQty: 0,
    ajioQty: 0,
    amazonQty: 0,
    flipkartQty: 0,
    snapdealQty: 0,
    websiteQty: 0,
    // Platform Returns
    myntraPrice: 0,
    ajioPrice: 0,
    amazonPrice: 0,
    flipkartPrice: 0,
    snapdealPrice: 0,
    websitePrice: 0,
    // Amount Received per Platform
    myntraAmountReceived: 0,
    ajioAmountReceived: 0,
    amazonAmountReceived: 0,
    flipkartAmountReceived: 0,
    snapdealAmountReceived: 0,
    websiteAmountReceived: 0,
  });

  const [reports, setReports] = useState<OnlineDailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calculate total quantity from all platforms
  const totalQuantity = formData.myntraQty + formData.ajioQty + formData.amazonQty + 
                        formData.flipkartQty + formData.snapdealQty + formData.websiteQty;
  
  // Calculate total amount received from all platform amounts
  const totalAmountReceived = formData.myntraAmountReceived + formData.ajioAmountReceived + formData.amazonAmountReceived + 
                              formData.flipkartAmountReceived + formData.snapdealAmountReceived + formData.websiteAmountReceived;
  
  // Calculate total returns from all platform returns
  const totalReturns = formData.myntraPrice + formData.ajioPrice + formData.amazonPrice + 
                       formData.flipkartPrice + formData.snapdealPrice + formData.websitePrice;
  
  // Fetch all reports
  const fetchReports = async () => {
    try {
      const response = await api.get("/online-daily-report");
      if (response.data.data && Array.isArray(response.data.data)) {
        setReports(response.data.data);
        console.log("✅ Online Reports fetched:", response.data.data.length, "records");
        console.log("📊 First record data:", response.data.data[0]);
      } else {
        console.warn("⚠️ Unexpected response format:", response.data);
        setReports([]);
      }
    } catch (error) {
      console.error("❌ Error fetching online reports:", error);
      setReports([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "date") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      const numValue = value === "" ? 0 : parseFloat(value);
      const finalValue = isNaN(numValue) ? 0 : numValue;
      console.log(`📝 ${name}: "${value}" → ${finalValue}`);
      setFormData((prev) => ({ ...prev, [name]: finalValue }));
    }
  };

  // Handle Enter key to move to next input field
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        const inputs = Array.from(form.querySelectorAll('input:not([readonly]):not([type="submit"])')).filter(
          (input) => (input as HTMLInputElement).type !== 'submit'
        ) as HTMLInputElement[];
        const currentIndex = inputs.indexOf(e.currentTarget);
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
          inputs[currentIndex + 1].select();
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    console.log("📤 Submitting form data:", formData);

    try {
      const response = await api.post("/online-daily-report", formData);
      
      console.log("✅ Server response:", response.data);
      setMessage({ type: "success", text: response.data.message });
      
      // Calculate next date (advance by 1 day)
      const currentDate = new Date(formData.date);
      currentDate.setDate(currentDate.getDate() + 1);
      const nextDate = currentDate.toISOString().split("T")[0];
      
      // Reset form with next date
      setFormData({
        date: nextDate,
        // Platform Quantities
        myntraQty: 0,
        ajioQty: 0,
        amazonQty: 0,
        flipkartQty: 0,
        snapdealQty: 0,
        websiteQty: 0,
        // Platform Returns
        myntraPrice: 0,
        ajioPrice: 0,
        amazonPrice: 0,
        flipkartPrice: 0,
        snapdealPrice: 0,
        websitePrice: 0,
        // Amount Received per Platform
        myntraAmountReceived: 0,
        ajioAmountReceived: 0,
        amazonAmountReceived: 0,
        flipkartAmountReceived: 0,
        snapdealAmountReceived: 0,
        websiteAmountReceived: 0,
      });
      
      // Refresh reports to show new data
      await fetchReports();
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Network error. Please try again.";
      setMessage({ type: "error", text: errorMessage });
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasDraftData =
    formData.myntraQty !== 0 ||
    formData.ajioQty !== 0 ||
    formData.amazonQty !== 0 ||
    formData.flipkartQty !== 0 ||
    formData.snapdealQty !== 0 ||
    formData.websiteQty !== 0 ||
    formData.myntraPrice !== 0 ||
    formData.ajioPrice !== 0 ||
    formData.amazonPrice !== 0 ||
    formData.flipkartPrice !== 0 ||
    formData.snapdealPrice !== 0 ||
    formData.websitePrice !== 0 ||
    formData.myntraAmountReceived !== 0 ||
    formData.ajioAmountReceived !== 0 ||
    formData.amazonAmountReceived !== 0 ||
    formData.flipkartAmountReceived !== 0 ||
    formData.snapdealAmountReceived !== 0 ||
    formData.websiteAmountReceived !== 0;

  // Calculate totals for balance sheet (include current form values as a live preview)
  const calculateTotals = () => {
    if (reports.length === 0 && !hasDraftData) return null;

    const baseTotals = reports.reduce(
      (acc, report) => ({
        totalQuantity: acc.totalQuantity + (report.totalQuantity || 0),
        myntraQty: acc.myntraQty + (report.myntraQty || 0),
        ajioQty: acc.ajioQty + (report.ajioQty || 0),
        amazonQty: acc.amazonQty + (report.amazonQty || 0),
        flipkartQty: acc.flipkartQty + (report.flipkartQty || 0),
        snapdealQty: acc.snapdealQty + (report.snapdealQty || 0),
        websiteQty: acc.websiteQty + (report.websiteQty || 0),
        myntraPrice: acc.myntraPrice + (report.myntraPrice || 0),
        ajioPrice: acc.ajioPrice + (report.ajioPrice || 0),
        amazonPrice: acc.amazonPrice + (report.amazonPrice || 0),
        flipkartPrice: acc.flipkartPrice + (report.flipkartPrice || 0),
        snapdealPrice: acc.snapdealPrice + (report.snapdealPrice || 0),
        websitePrice: acc.websitePrice + (report.websitePrice || 0),
        myntraAmountReceived: acc.myntraAmountReceived + (report.myntraAmountReceived || 0),
        ajioAmountReceived: acc.ajioAmountReceived + (report.ajioAmountReceived || 0),
        amazonAmountReceived: acc.amazonAmountReceived + (report.amazonAmountReceived || 0),
        flipkartAmountReceived: acc.flipkartAmountReceived + (report.flipkartAmountReceived || 0),
        snapdealAmountReceived: acc.snapdealAmountReceived + (report.snapdealAmountReceived || 0),
        websiteAmountReceived: acc.websiteAmountReceived + (report.websiteAmountReceived || 0),
      }),
      {
        totalQuantity: 0,
        myntraQty: 0,
        ajioQty: 0,
        amazonQty: 0,
        flipkartQty: 0,
        snapdealQty: 0,
        websiteQty: 0,
        myntraPrice: 0,
        ajioPrice: 0,
        amazonPrice: 0,
        flipkartPrice: 0,
        snapdealPrice: 0,
        websitePrice: 0,
        myntraAmountReceived: 0,
        ajioAmountReceived: 0,
        amazonAmountReceived: 0,
        flipkartAmountReceived: 0,
        snapdealAmountReceived: 0,
        websiteAmountReceived: 0,
      }
    );

    if (!hasDraftData) return baseTotals;

    return {
      totalQuantity: baseTotals.totalQuantity + totalQuantity,
      myntraQty: baseTotals.myntraQty + formData.myntraQty,
      ajioQty: baseTotals.ajioQty + formData.ajioQty,
      amazonQty: baseTotals.amazonQty + formData.amazonQty,
      flipkartQty: baseTotals.flipkartQty + formData.flipkartQty,
      snapdealQty: baseTotals.snapdealQty + formData.snapdealQty,
      websiteQty: baseTotals.websiteQty + formData.websiteQty,
      myntraPrice: baseTotals.myntraPrice + formData.myntraPrice,
      ajioPrice: baseTotals.ajioPrice + formData.ajioPrice,
      amazonPrice: baseTotals.amazonPrice + formData.amazonPrice,
      flipkartPrice: baseTotals.flipkartPrice + formData.flipkartPrice,
      snapdealPrice: baseTotals.snapdealPrice + formData.snapdealPrice,
      websitePrice: baseTotals.websitePrice + formData.websitePrice,
      myntraAmountReceived: baseTotals.myntraAmountReceived + formData.myntraAmountReceived,
      ajioAmountReceived: baseTotals.ajioAmountReceived + formData.ajioAmountReceived,
      amazonAmountReceived: baseTotals.amazonAmountReceived + formData.amazonAmountReceived,
      flipkartAmountReceived: baseTotals.flipkartAmountReceived + formData.flipkartAmountReceived,
      snapdealAmountReceived: baseTotals.snapdealAmountReceived + formData.snapdealAmountReceived,
      websiteAmountReceived: baseTotals.websiteAmountReceived + formData.websiteAmountReceived,
    };
  };

  const totals = calculateTotals();

  const downloadExcel = () => {
    // Prepare data for Excel - show summary view
    const excelData = reports.map((report) => {
      const totalQty = (report.myntraQty || 0) + (report.ajioQty || 0) + (report.amazonQty || 0) + 
                       (report.flipkartQty || 0) + (report.snapdealQty || 0) + (report.websiteQty || 0);
      const totalAmt = (report.myntraAmountReceived || 0) + (report.ajioAmountReceived || 0) + (report.amazonAmountReceived || 0) + 
                       (report.flipkartAmountReceived || 0) + (report.snapdealAmountReceived || 0) + (report.websiteAmountReceived || 0);
      const totalRet = (report.myntraPrice || 0) + (report.ajioPrice || 0) + (report.amazonPrice || 0) + 
                       (report.flipkartPrice || 0) + (report.snapdealPrice || 0) + (report.websitePrice || 0);
      return {
        Date: new Date(report.date).toLocaleDateString("en-GB"),
        "Total Qty": totalQty,
        "Total Amount Received": totalAmt.toFixed(2),
        "Total Returns": totalRet.toFixed(2),
      };
    });

    // Add totals row if available
    if (totals && !hasDraftData) {
      const totalQty = totals.myntraQty + totals.ajioQty + totals.amazonQty + 
                       totals.flipkartQty + totals.snapdealQty + totals.websiteQty;
      const totalAmt = totals.myntraAmountReceived + totals.ajioAmountReceived + totals.amazonAmountReceived + 
                       totals.flipkartAmountReceived + totals.snapdealAmountReceived + totals.websiteAmountReceived;
      const totalRet = totals.myntraPrice + totals.ajioPrice + totals.amazonPrice + 
                       totals.flipkartPrice + totals.snapdealPrice + totals.websitePrice;
      excelData.push({
        Date: "Total",
        "Total Qty": totalQty,
        "Total Amount Received": totalAmt.toFixed(2),
        "Total Returns": totalRet.toFixed(2),
      });
    }

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 12 }, // Date
      { wch: 12 }, // Myntra Qty
      { wch: 10 }, // Ajio Qty
      { wch: 12 }, // Amazon Qty
      { wch: 12 }, // Flipkart Qty
      { wch: 12 }, // Snapdeal Qty
      { wch: 12 }, // Website Qty
      { wch: 14 }, // Total Quantity
      { wch: 13 }, // Myntra Price
      { wch: 11 }, // Ajio Price
      { wch: 13 }, // Amazon Price
      { wch: 13 }, // Flipkart Price
      { wch: 14 }, // Snapdeal Price
      { wch: 13 }, // Website Price
      { wch: 12 }, // Total Sale
      { wch: 13 }, // Total Returns
      { wch: 15 }, // Amount Received
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "E-Commerce Daily Reports");

    // Generate file name with current date
    const fileName = `Ecommerce_Daily_Reports_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">E-Commerce Daily Report</h1>
          <p className="text-gray-600">Track your online sales, expenses, and performance metrics</p>
        </div>

        {/* Add Daily Report Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Daily Report</h2>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Report Details Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                Report Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Date */}
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-orange-600">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="w-full px-4 py-2.5 bg-orange-50 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black font-semibold focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    One report per date. Changes date will update existing report.
                  </p>
                </div>
              </div>
            </div>

            {/* Platform Quantities Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                Platform Sales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                {/* Myntra Qty */}
                <div>
                  <label htmlFor="myntraQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Myntra (Qty)
                  </label>
                  <input
                    type="number"
                    id="myntraQty"
                    name="myntraQty"
                    value={formData.myntraQty}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="1"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Ajio Qty */}
                <div>
                  <label htmlFor="ajioQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Ajio (Qty)
                  </label>
                  <input
                    type="number"
                    id="ajioQty"
                    name="ajioQty"
                    value={formData.ajioQty}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="1"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Amazon Qty */}
                <div>
                  <label htmlFor="amazonQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Amazon (Qty)
                  </label>
                  <input
                    type="number"
                    id="amazonQty"
                    name="amazonQty"
                    value={formData.amazonQty}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="1"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Flipkart Qty */}
                <div>
                  <label htmlFor="flipkartQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Flipkart (Qty)
                  </label>
                  <input
                    type="number"
                    id="flipkartQty"
                    name="flipkartQty"
                    value={formData.flipkartQty}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="1"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Snapdeal Qty */}
                <div>
                  <label htmlFor="snapdealQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Snapdeal (Qty)
                  </label>
                  <input
                    type="number"
                    id="snapdealQty"
                    name="snapdealQty"
                    value={formData.snapdealQty}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="1"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                {/* Website Qty */}
                <div>
                  <label htmlFor="websiteQty" className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Qty)
                  </label>
                  <input
                    type="number"
                    id="websiteQty"
                    name="websiteQty"
                    value={formData.websiteQty}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="1"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Total Quantity (Auto-calculated) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Quantity (Auto-calculated)
                  </label>
                  <input
                    type="number"
                    value={totalQuantity}
                    readOnly
                    className="w-full px-4 py-2.5 bg-orange-50 text-black border-2 border-orange-300 rounded-lg font-semibold cursor-not-allowed"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Platform Returns Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                Platform Returns
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Myntra Returns */}
                <div>
                  <label htmlFor="myntraPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Myntra (Returns)
                  </label>
                  <input
                    type="number"
                    id="myntraPrice"
                    name="myntraPrice"
                    value={formData.myntraPrice}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Ajio Returns */}
                <div>
                  <label htmlFor="ajioPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Ajio (Returns)
                  </label>
                  <input
                    type="number"
                    id="ajioPrice"
                    name="ajioPrice"
                    value={formData.ajioPrice}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Amazon Returns */}
                <div>
                  <label htmlFor="amazonPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Amazon (Returns)
                  </label>
                  <input
                    type="number"
                    id="amazonPrice"
                    name="amazonPrice"
                    value={formData.amazonPrice}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Flipkart Returns */}
                <div>
                  <label htmlFor="flipkartPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Flipkart (Returns)
                  </label>
                  <input
                    type="number"
                    id="flipkartPrice"
                    name="flipkartPrice"
                    value={formData.flipkartPrice}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Snapdeal Returns */}
                <div>
                  <label htmlFor="snapdealPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Snapdeal (Returns)
                  </label>
                  <input
                    type="number"
                    id="snapdealPrice"
                    name="snapdealPrice"
                    value={formData.snapdealPrice}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Website Returns */}
                <div>
                  <label htmlFor="websitePrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Returns)
                  </label>
                  <input
                    type="number"
                    id="websitePrice"
                    name="websitePrice"
                    value={formData.websitePrice}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Amount Received Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b-2 border-orange-200 pb-2">
                Amount Received
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Myntra Amount */}
                <div>
                  <label htmlFor="myntraAmountReceived" className="block text-sm font-medium text-gray-700 mb-2">
                    Myntra (Amount)
                  </label>
                  <input
                    type="number"
                    id="myntraAmountReceived"
                    name="myntraAmountReceived"
                    value={formData.myntraAmountReceived}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Ajio Amount */}
                <div>
                  <label htmlFor="ajioAmountReceived" className="block text-sm font-medium text-gray-700 mb-2">
                    Ajio (Amount)
                  </label>
                  <input
                    type="number"
                    id="ajioAmountReceived"
                    name="ajioAmountReceived"
                    value={formData.ajioAmountReceived}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Amazon Amount */}
                <div>
                  <label htmlFor="amazonAmountReceived" className="block text-sm font-medium text-gray-700 mb-2">
                    Amazon (Amount)
                  </label>
                  <input
                    type="number"
                    id="amazonAmountReceived"
                    name="amazonAmountReceived"
                    value={formData.amazonAmountReceived}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Flipkart Amount */}
                <div>
                  <label htmlFor="flipkartAmountReceived" className="block text-sm font-medium text-gray-700 mb-2">
                    Flipkart (Amount)
                  </label>
                  <input
                    type="number"
                    id="flipkartAmountReceived"
                    name="flipkartAmountReceived"
                    value={formData.flipkartAmountReceived}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Snapdeal Amount */}
                <div>
                  <label htmlFor="snapdealAmountReceived" className="block text-sm font-medium text-gray-700 mb-2">
                    Snapdeal (Amount)
                  </label>
                  <input
                    type="number"
                    id="snapdealAmountReceived"
                    name="snapdealAmountReceived"
                    value={formData.snapdealAmountReceived}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {/* Website Amount */}
                <div>
                  <label htmlFor="websiteAmountReceived" className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Amount)
                  </label>
                  <input
                    type="number"
                    id="websiteAmountReceived"
                    name="websiteAmountReceived"
                    value={formData.websiteAmountReceived}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={(e) => e.target.select()}
                    step="0.01"
                    className="w-full px-4 py-2.5 bg-gray-50 text-black border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>



            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Saving..." : "Save Report"}
              </button>
            </div>
          </form>
        </div>

        {/* Balance Sheet */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Records</h2>
              <p className="text-sm text-gray-600 mt-1">
                {reports.length === 0 ? "No records available" : `${reports.length} record${reports.length !== 1 ? "s" : ""} loaded`}
              </p>
            </div>
            {reports.length > 0 && (
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Excel
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Qty</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Amount Received</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Returns</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const totalQty = (report.myntraQty || 0) + (report.ajioQty || 0) + (report.amazonQty || 0) + 
                                   (report.flipkartQty || 0) + (report.snapdealQty || 0) + (report.websiteQty || 0);
                  const totalAmount = (report.myntraAmountReceived || 0) + (report.ajioAmountReceived || 0) + (report.amazonAmountReceived || 0) + 
                                      (report.flipkartAmountReceived || 0) + (report.snapdealAmountReceived || 0) + (report.websiteAmountReceived || 0);
                  const totalReturns = (report.myntraPrice || 0) + (report.ajioPrice || 0) + (report.amazonPrice || 0) + 
                                       (report.flipkartPrice || 0) + (report.snapdealPrice || 0) + (report.websitePrice || 0);
                  return (
                    <tr key={report._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(report.date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-orange-600 text-right">
                        {totalQty}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ₹{totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ₹{totalReturns.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
                {totals && (
                  <tr className="bg-gray-100 font-semibold border-t-2 border-gray-300">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {hasDraftData ? "Total (incl. draft)" : "Total"}
                    </td>
                    <td className="px-4 py-3 text-sm text-orange-600 text-right">
                      {totals.myntraQty + totals.ajioQty + totals.amazonQty + totals.flipkartQty + totals.snapdealQty + totals.websiteQty}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ₹{(totals.myntraAmountReceived + totals.ajioAmountReceived + totals.amazonAmountReceived + totals.flipkartAmountReceived + totals.snapdealAmountReceived + totals.websiteAmountReceived).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ₹{(totals.myntraPrice + totals.ajioPrice + totals.amazonPrice + totals.flipkartPrice + totals.snapdealPrice + totals.websitePrice).toFixed(2)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="text-center py-8 text-gray-500">No reports available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
