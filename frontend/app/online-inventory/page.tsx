"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "../../lib/api";

type InventoryItem = {
  dno: string;
  color: string;
  size: string;
  inbound: number;
  outbound: number;
  stock: number;
};

type GroupedInventory = {
  [color: string]: InventoryItem[];
};

type ProductDetails = {
  designNumber: string;
  brand?: string;
  fabric?: string;
  fabricComposition?: string;
  gsm?: number;
  mrp?: number;
  image?: string;
};

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
const COLORS = [
  "BLACK",
  "NAVY",
  "BLUE",
  "INDIGO",
  "GRAY",
  "GREY",
  "CHARCOAL",
  "WHITE",
  "RED",
  "GREEN",
  "YELLOW",
  "MUSTARD",
  "ECRU",
  "SILVER",
  "MIX",
];

export default function OnlineInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  useEffect(() => {
    initializeInventory();
  }, []);

  const initializeInventory = async () => {
    try {
      setLoading(true);
      await fetchInventory();
    } catch (err) {
      console.error("Error initializing inventory:", err);
    } finally {
      setLoading(false);
    }
  };
      const fullUrl = `${api.defaults.baseURL}/inventory/warehouse/online`;

  const fetchInventory = async () => {
    try {
      console.log("🔗 Full Backend URL:", fullUrl);
      const response = await api.get("/inventory/warehouse/online");
      console.log("✅ Response data:", response.data);
      setInventory(response.data.inventory || []);
    } catch (err: any) {
      console.error("❌ Error fetching online inventory:", err);
      if (err.response) {
        console.error("  Status:", err.response.status);
        console.error("  Data:", err.response.data);
        console.error("  URL requested:", fullUrl);
      }
      setInventory([]);
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  // Group inventory by design number
  const groupedByDesign = inventory.reduce((acc, item) => {
    if (!acc[item.dno]) {
      acc[item.dno] = [];
    }
    acc[item.dno].push(item);
    return acc;
  }, {} as { [key: string]: InventoryItem[] });

  // Filter
  const filteredDesigns = Object.entries(groupedByDesign).filter(
    ([designNumber, items]) => {
      // Search filter
      const matchesSearch = designNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Size filter
      const matchesSize =
        selectedSizes.length === 0 ||
        items.some((item) => selectedSizes.includes(item.size));

      // Color filter
      const matchesColor =
        selectedColors.length === 0 ||
        items.some((item) => selectedColors.includes(item.color));

      return matchesSearch && matchesSize && matchesColor;
    }
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Online Inventory
            </h1>
            <p className="text-sm text-gray-500">
              Stock levels across online warehouse
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Design Number (e.g., DN-2025-001)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent text-gray-800 text-lg bg-gray-50"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Filters Sidebar */}
          <aside className="bg-white border rounded-lg shadow-sm p-6 h-fit sticky top-20 self-start">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Filters
            </h2>

            {/* Size Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Size</h3>
              <div className="space-y-3">
                {SIZES.map((size) => (
                  <label
                    key={size}
                    className="flex items-center gap-3 text-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSizes.includes(size)}
                      onChange={() => toggleSize(size)}
                      className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-800"
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Color
              </h3>
              <div className="space-y-3">
                {COLORS.map((color) => (
                  <label
                    key={color}
                    className="flex items-center gap-3 text-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={() => toggleColor(color)}
                      className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-800"
                    />
                    <span className="capitalize">{color.toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedSizes.length > 0 || selectedColors.length > 0) && (
              <button
                onClick={() => {
                  setSelectedSizes([]);
                  setSelectedColors([]);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-semibold"
              >
                Clear Filters
              </button>
            )}
          </aside>

          {/* Products List */}
          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
                <p className="mt-4 text-gray-600">
                  Loading inventory...
                </p>
              </div>
            ) : filteredDesigns.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900">
                  No products found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters or search term
                </p>
              </div>
            ) : (
              filteredDesigns.map(([designNumber, items]) => (
                <ProductCard key={designNumber} designNumber={designNumber} items={items} />
              ))
            )}

            {!loading && filteredDesigns.length > 0 && (
              <div className="text-center text-gray-600">
                Showing {filteredDesigns.length} of{" "}
                {Object.keys(groupedByDesign).length} products
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type ProductCardProps = {
  designNumber: string;
  items: InventoryItem[];
};

function ProductCard({ designNumber, items }: ProductCardProps) {
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null
  );
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [designNumber]);

  const fetchProductDetails = async () => {
    try {
      setLoadingDetails(true);
      // Use search endpoint to fetch specific job card details
      const response = await api.get("/jobcard/search", {
        params: { query: designNumber }
      });
      const jobCards = response.data;
      const matchingCard = jobCards.find(
        (card: any) =>
          card.designNumber.toLowerCase() === designNumber.toLowerCase()
      );

      if (matchingCard) {
        setProductDetails({
          designNumber: matchingCard.designNumber,
          image: matchingCard.image,
        });
      } else {
        setProductDetails({
          designNumber: designNumber.toUpperCase(),
        });
      }
    } catch (err) {
      console.error("Error fetching product details:", err);
      setProductDetails({
        designNumber: designNumber.toUpperCase(),
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Group items by color
  const groupedByColor: GroupedInventory = items.reduce((acc, item) => {
    if (!acc[item.color]) {
      acc[item.color] = [];
    }
    acc[item.color].push(item);
    return acc;
  }, {} as GroupedInventory);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="md:flex md:gap-10 p-6">
        {/* Product Image */}
        <div className="md:w-1/2 w-full">
          <div className="relative w-full h-[520px] bg-gray-100 rounded-lg overflow-hidden">
            {productDetails?.image ? (
              <Image
                src={productDetails.image}
                alt={designNumber}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="md:w-1/2 w-full mt-6 md:mt-0 space-y-6">
          <div className="flex items-start justify-between">
            <DetailBlock label="Design Number" value={productDetails?.designNumber || designNumber.toUpperCase()} />
            <Link
              href={`/online-inventory/edit/${encodeURIComponent(designNumber)}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </Link>
          </div>

          {/* Stock Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {items.reduce((sum, item) => sum + item.inbound, 0)}
              </div>
              <div className="text-xs font-medium text-gray-600">Inbound</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {items.reduce((sum, item) => sum + item.outbound, 0)}
              </div>
              <div className="text-xs font-medium text-gray-600">Outbound</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {items.reduce((sum, item) => sum + item.stock, 0)}
              </div>
              <div className="text-xs font-medium text-gray-600">Total Stock</div>
            </div>
          </div>

          {/* Available Stock Table */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Available Stock
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                      Colour
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                      Size
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                      Inbound
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                      Outbound
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(groupedByColor).map(([color, colorItems]) =>
                    colorItems
                      .filter((item) => item.stock > 0 || item.outbound > 0)
                      .map((item, idx) => (
                        <tr
                          key={`${color}-${item.size}-${idx}`}
                          className={`hover:bg-gray-50 ${
                            item.outbound > 0 ? "bg-red-50" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded-full border ${getColorClass(
                                  color
                                )}`}
                              />
                              <span className="text-gray-900 capitalize">
                                {color.toLowerCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900 font-medium">{item.size}</span>
                              {/* {item.outbound > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                  ⚠ Dispatched
                                </span>
                              )} */}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-right text-green-600 font-semibold">
                            {item.inbound}
                          </td>
                          <td
                            className={`px-3 py-2 text-xs text-right font-semibold ${
                              item.outbound > 0
                                ? "text-red-700 bg-red-100"
                                : "text-red-600"
                            }`}
                          >
                            {item.outbound}
                          </td>
                          <td className="px-3 py-2 text-xs text-right">
                            <span
                              className={`inline-flex items-center justify-center min-w-[32px] h-8 px-2 rounded-full text-white text-xs font-semibold ${
                                item.stock < 10
                                  ? "bg-red-600"
                                  : "bg-black"
                              }`}
                            >
                              {item.stock}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type DetailBlockProps = {
  label: string;
  value: string | number;
};

function DetailBlock({ label, value }: DetailBlockProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function getColorClass(color: string): string {
  const colorLower = color.toLowerCase();

  if (colorLower.includes("black")) return "bg-black";
  if (colorLower.includes("navy")) return "bg-blue-900";
  if (colorLower.includes("blue")) return "bg-blue-500";
  if (colorLower.includes("indigo")) return "bg-indigo-600";
  if (colorLower.includes("gray") || colorLower.includes("grey"))
    return "bg-gray-500";
  if (colorLower.includes("charcoal")) return "bg-gray-700";
  if (colorLower.includes("white")) return "bg-white border-gray-300";
  if (colorLower.includes("red")) return "bg-red-600";
  if (colorLower.includes("green")) return "bg-green-600";
  if (colorLower.includes("yellow")) return "bg-yellow-400";
  if (colorLower.includes("mustard")) return "bg-yellow-600";
  if (colorLower.includes("ecru")) return "bg-amber-100";
  if (colorLower.includes("silver")) return "bg-gray-300";

  return "bg-gray-400";
}
