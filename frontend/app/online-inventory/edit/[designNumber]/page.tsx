"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";

type InventoryItem = {
  dno: string;
  color: string;
  size: string;
  stock: number;
};

type EditableRow = {
  key: string;
  size: string;
  currentColor: string;
  currentQty: number;
  newColor: string;
  newQty: number;
};

const getRoleFromCookie = () => {
  if (typeof document === "undefined") return "";
  const roleMatch = document.cookie.match(/(?:^|; )ims_user_role=([^;]+)/);
  return roleMatch?.[1] || "";
};

export default function EditOnlineInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const designNumber = decodeURIComponent((params.designNumber as string) || "").trim();

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [rows, setRows] = useState<EditableRow[]>([]);

  useEffect(() => {
    const role = getRoleFromCookie();
    if (role !== "admin") {
      router.replace("/online-inventory");
      return;
    }
    fetchInventory();
  }, [designNumber]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const inventoryResponse = await api.get("/inventory/warehouse/online", {
        timeout: 120000,
      });

      const allInventory = inventoryResponse.data.inventory || [];
      const filtered = allInventory.filter(
        (item: InventoryItem) => (item.dno || "").trim().toLowerCase() === designNumber.toLowerCase()
      );

      const grouped = new Map<string, EditableRow>();
      filtered.forEach((item: InventoryItem) => {
        const key = `${item.color}__${item.size}`;
        const existing = grouped.get(key);
        const qty = Number(item.stock) || 0;

        if (existing) {
          existing.currentQty += qty;
          existing.newQty += qty;
        } else {
          grouped.set(key, {
            key,
            size: item.size,
            currentColor: item.color,
            currentQty: qty,
            newColor: item.color,
            newQty: qty,
          });
        }
      });

      setRows(Array.from(grouped.values()));
    } catch (err) {
      console.error("Failed to load online inventory:", err);
      alert("Failed to load inventory data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const createAdjustment = async (color: string, size: string, qty: number, formType: "purchase" | "sales") => {
    if (qty <= 0) return;
    await api.post("/warehouse/online", {
      dno: designNumber,
      color,
      size,
      qty,
      formType,
      date: new Date().toISOString(),
    });
  };

  const handleSaveRow = async (row: EditableRow) => {
    const nextColor = (row.newColor || "").trim();
    const nextQty = Number(row.newQty);

    if (!nextColor) {
      alert("Color is required");
      return;
    }

    if (!Number.isFinite(nextQty) || nextQty < 0) {
      alert("Quantity must be 0 or greater");
      return;
    }

    const colorChanged = nextColor.toLowerCase() !== row.currentColor.toLowerCase();
    const qtyChanged = nextQty !== row.currentQty;
    if (!colorChanged && !qtyChanged) {
      return;
    }

    try {
      setSavingKey(row.key);

      if (colorChanged) {
        if (row.currentQty > 0) {
          await createAdjustment(row.currentColor, row.size, row.currentQty, "sales");
        }
        if (nextQty > 0) {
          await createAdjustment(nextColor, row.size, nextQty, "purchase");
        }
      } else {
        const delta = nextQty - row.currentQty;
        if (delta > 0) {
          await createAdjustment(row.currentColor, row.size, delta, "purchase");
        } else if (delta < 0) {
          await createAdjustment(row.currentColor, row.size, Math.abs(delta), "sales");
        }
      }

      await fetchInventory();
      alert("Online inventory updated successfully");
    } catch (err: unknown) {
      console.error("Failed to update online inventory:", err);
      const apiError =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response?.data?.error === "string"
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      alert(apiError || "Failed to update inventory");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Online Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">Design Number: {designNumber}</p>
            </div>
            <button onClick={() => router.push("/online-inventory")} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
              ← Back to Inventory
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Color and Quantity</h2>
          {rows.length === 0 ? (
            <p className="text-gray-500 text-sm">No inventory rows found for this design number.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Size</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Current Color</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Current Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">New Color</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">New Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((row) => (
                    <tr key={row.key} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-900 font-medium">{row.size}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{row.currentColor}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{row.currentQty}</td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.newColor}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((item) =>
                                item.key === row.key ? { ...item, newColor: e.target.value } : item
                              )
                            )
                          }
                          className="w-full px-2 py-1 border rounded text-sm text-black bg-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          value={row.newQty}
                          onChange={(e) =>
                            setRows((prev) =>
                              prev.map((item) =>
                                item.key === row.key
                                  ? { ...item, newQty: Number(e.target.value || 0) }
                                  : item
                              )
                            )
                          }
                          className="w-28 px-2 py-1 border rounded text-sm text-black bg-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleSaveRow(row)}
                          disabled={savingKey === row.key}
                          className="px-3 py-1.5 bg-gray-800 text-white rounded text-sm font-medium hover:bg-gray-700 disabled:bg-gray-400"
                        >
                          {savingKey === row.key ? "Saving..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}