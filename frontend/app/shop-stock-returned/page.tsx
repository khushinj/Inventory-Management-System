"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import * as XLSX from "xlsx";

type Entry = {
  _id: string;
  dno?: string;
  color?: string;
  size?: string;
  qty: number;
  mrp?: number;
  date?: string;
  formType?: string;
  domain: string;
};

type SampleRow = {
  dno: string;
  type: string;
  color: string;
  mrp: number;
  date: string;
  sizes: {
    [size: string]: number;
  };
  _id?: string;
};

type ShopInventoryItem = {
  designNumber: string;
  color: string;
  size: string;
  import?: number;
  customerReturn?: number;
  stockReturn?: number;
  sales?: number;
  net?: number;
  type?: string;
};

const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

const normalizeDesignNumber = (value: string) =>
  value.trim().replace(/\s+/g, "").toUpperCase();

const normalizeColor = (value: string) =>
  value.trim().replace(/\s+/g, " ").toUpperCase();

const getColorDotClass = (color: string) => {
  const normalized = normalizeColor(color);

  if (normalized.includes("PINK")) return "bg-pink-300";
  if (normalized.includes("PURPLE")) return "bg-violet-400";
  if (normalized.includes("NAVY")) return "bg-slate-800";
  if (normalized.includes("RUST") || normalized.includes("BROWN") || normalized.includes("ORANGE")) return "bg-orange-700";
  if (normalized.includes("OLIVE") || normalized.includes("GREEN")) return "bg-lime-700";
  if (normalized.includes("BLUE")) return "bg-blue-500";
  return "bg-gray-400";
};

const normalizeSizeKey = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return normalized === "2XL" ? "XXL" : normalized;
};

const normalizeStockReturnRow = (row: SampleRow): SampleRow => {
  const normalizedSizes: SampleRow["sizes"] = {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
    "3XL": 0,
    "4XL": 0,
    "5XL": 0,
    "6XL": 0,
  };

  Object.entries(row.sizes || {}).forEach(([size, qty]) => {
    const normalizedSize = normalizeSizeKey(size);
    if (normalizedSize in normalizedSizes) {
      normalizedSizes[normalizedSize] = (normalizedSizes[normalizedSize] || 0) + (Number(qty) || 0);
    }
  });

  return {
    ...row,
    dno: normalizeDesignNumber(row.dno || ""),
    type: (row.type || "").trim(),
    color: normalizeColor(row.color || ""),
    sizes: normalizedSizes,
  };
};

export default function StockReturnedPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [shopInventoryRows, setShopInventoryRows] = useState<ShopInventoryItem[]>([]);
  const [stockReturnedRows, setStockReturnedRows] = useState<SampleRow[]>([]);
  const [activeTab, setActiveTab] = useState<"all-stock" | "transfer-history">("transfer-history");
  const [selectedColors, setSelectedColors] = useState<Record<string, boolean>>({});
  const [expandedDnos, setExpandedDnos] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [newStockReturnedRow, setNewStockReturnedRow] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    mrp: 0,
    date: new Date().toISOString().split("T")[0],
    sizes: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      "3XL": 0,
      "4XL": 0,
      "5XL": 0,
      "6XL": 0,
    },
  });
  const [isCreatingStockReturn, setIsCreatingStockReturn] = useState(false);
  const [editingStockReturnRow, setEditingStockReturnRow] = useState<string | null>(null);
  const [editStockReturnForm, setEditStockReturnForm] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    mrp: 0,
    date: new Date().toISOString().split("T")[0],
    sizes: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      "3XL": 0,
      "4XL": 0,
      "5XL": 0,
      "6XL": 0,
    },
  });

  const stockReturnDnoRef = useRef<HTMLInputElement>(null);
  const stockReturnTypeRef = useRef<HTMLInputElement>(null);
  const stockReturnColorRef = useRef<HTMLInputElement>(null);
  const stockReturnMrpRef = useRef<HTMLInputElement>(null);
  const stockReturnDateRef = useRef<HTMLInputElement>(null);
  const stockReturnSizeRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedCount = Object.values(selectedColors).filter(Boolean).length;

  useEffect(() => {
    fetchAllStockData();
  }, []);

  const recalculateShopInventory = async () => {
    try {
      await api.post("/shop-inventory/calculate");
    } catch (error) {
      console.error("Error recalculating shop inventory:", error);
    }
  };

  const fetchAllStockData = async () => {
    try {
      setLoading(true);
      const [inventoryRes, stockReturnedRes] = await Promise.all([
        api.get("/shop-inventory"),
        api.get("/stock-returned"),
      ]);

      const inventoryRows = Array.isArray(inventoryRes.data?.data) ? inventoryRes.data.data : [];
      setShopInventoryRows(inventoryRows);

      if (stockReturnedRes.data && Array.isArray(stockReturnedRes.data)) {
        setEntries(stockReturnedRes.data);

        if (stockReturnedRes.data.length > 0) {
          convertToGroupedRows(stockReturnedRes.data);
        } else {
          setStockReturnedRows([]);
        }
      } else {
        setEntries([]);
        setStockReturnedRows([]);
      }
    } catch (error) {
      console.error("Error fetching stock inventory data:", error);
      setEntries([]);
      setShopInventoryRows([]);
      setStockReturnedRows([]);
    } finally {
      setLoading(false);
    }
  };

  const convertToGroupedRows = (allStockReturned: any[]) => {
    const rows: SampleRow[] = allStockReturned.map((entry) => ({
      dno: normalizeDesignNumber(entry.dno || ""),
      type: entry.type || "",
      color: normalizeColor(entry.color || ""),
      mrp: entry.mrp || 0,
      date: entry.date ? new Date(entry.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      sizes: {
        S: entry.items?.find((item: any) => item.size === "S")?.qty || 0,
        M: entry.items?.find((item: any) => item.size === "M")?.qty || 0,
        L: entry.items?.find((item: any) => item.size === "L")?.qty || 0,
        XL: entry.items?.find((item: any) => item.size === "XL")?.qty || 0,
        XXL: entry.items?.find((item: any) => item.size === "XXL")?.qty || 0,
        "3XL": entry.items?.find((item: any) => item.size === "3XL")?.qty || 0,
        "4XL": entry.items?.find((item: any) => item.size === "4XL")?.qty || 0,
        "5XL": entry.items?.find((item: any) => item.size === "5XL")?.qty || 0,
        "6XL": entry.items?.find((item: any) => item.size === "6XL")?.qty || 0,
      },
      _id: entry._id,
    }));
    setStockReturnedRows(rows);
  };

  const handleSaveStockReturnRow = async () => {
    const normalizedRow = normalizeStockReturnRow(newStockReturnedRow);

    if (!normalizedRow.dno || !normalizedRow.color) {
      alert("Please enter DNO and Color");
      return;
    }

    if (Object.values(normalizedRow.sizes).every(size => size === 0)) {
      alert("Please enter at least one size quantity");
      return;
    }

    const tempId = `temp_${Date.now()}`;

    try {
      const rowWithTempId = { ...normalizedRow, _id: tempId };

      // Add new row to local state immediately
      setStockReturnedRows([...stockReturnedRows, rowWithTempId]);

      // Reset form immediately so user can continue entering
      setNewStockReturnedRow({
        dno: "",
        type: "",
        color: "",
        mrp: 0,
        date: new Date().toISOString().split("T")[0],
        sizes: {
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          XXL: 0,
          "3XL": 0,
          "4XL": 0,
          "5XL": 0,
          "6XL": 0,
        },
      });

      // Keep input row visible for next entry
      stockReturnDnoRef.current?.focus();

      // Save to backend in background
      const totalQty = Object.values(normalizedRow.sizes).reduce((a, b) => a + b, 0);

      const dataToSave = {
        dno: normalizedRow.dno,
        type: normalizedRow.type,
        color: normalizedRow.color,
        mrp: normalizedRow.mrp,
        date: normalizedRow.date,
        items: Object.entries(normalizedRow.sizes)
          .filter(([_, qty]) => qty > 0)
          .map(([size, qty]) => ({ size: normalizeSizeKey(size), qty, mrp: normalizedRow.mrp })),
        totalQuantity: totalQty,
      };

      const res = await api.post("/stock-returned", dataToSave);
      await recalculateShopInventory();

      // Update the row with the real ID from backend
      setStockReturnedRows(prevRows =>
        prevRows.map(row =>
          row._id === tempId ? { ...row, _id: res.data._id } : row
        )
      );
    } catch (error) {
      console.error("Error saving stock return row:", error);
      alert("Failed to save stock return entry");
      // Remove the temporary row if save failed
      setStockReturnedRows(prevRows =>
        prevRows.filter(row => row._id !== tempId)
      );
    }
  };

  const handleEditStockReturnRow = (row: SampleRow) => {
    setEditingStockReturnRow(row._id || null);
    setEditStockReturnForm({ ...row });
  };

  const handleUpdateStockReturnRow = async () => {
    const normalizedForm = normalizeStockReturnRow(editStockReturnForm);

    if (!normalizedForm.dno || !normalizedForm.color) {
      alert("Please enter DNO and Color");
      return;
    }

    if (Object.values(normalizedForm.sizes).every(size => size === 0)) {
      alert("Please enter at least one size quantity");
      return;
    }

    try {
      const key = normalizedForm._id;

      // Update local state immediately
      setStockReturnedRows(stockReturnedRows.map(row => {
        if (row._id === key) {
          return normalizedForm;
        }
        return row;
      }));

      setEditingStockReturnRow(null);

      // Save to backend in background
      if (key) {
        const totalQty = Object.values(normalizedForm.sizes).reduce((a, b) => a + b, 0);

        const dataToUpdate = {
          dno: normalizedForm.dno,
          type: normalizedForm.type,
          color: normalizedForm.color,
          mrp: normalizedForm.mrp,
          date: normalizedForm.date,
          items: Object.entries(normalizedForm.sizes)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => ({ size: normalizeSizeKey(size), qty, mrp: normalizedForm.mrp })),
          totalQuantity: totalQty,
        };

        await api.put(`/stock-returned/${key}`, dataToUpdate);
        await recalculateShopInventory();
      }
    } catch (error) {
      console.error("Error updating stock return row:", error);
      alert("Failed to update stock return entry");
    }
  };

  const handleDeleteStockReturnRow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stock return entry?")) return;

    try {
      // Remove from local state immediately
      setStockReturnedRows(stockReturnedRows.filter(row => row._id !== id));

      // Delete from backend in background
      if (id) {
        await api.delete(`/stock-returned/${id}`);
        await recalculateShopInventory();
      }
    } catch (error) {
      console.error("Error deleting stock return row:", error);
      alert("Failed to delete stock return entry");
    }
  };

  const handleStockReturnKeyDown = (e: React.KeyboardEvent, field: string, index: number) => {
    if (e.key === "Enter") {
      if (field === "dno") {
        stockReturnTypeRef.current?.focus();
      } else if (field === "type") {
        stockReturnColorRef.current?.focus();
      } else if (field === "color") {
        stockReturnMrpRef.current?.focus();
      } else if (field === "mrp") {
        stockReturnDateRef.current?.focus();
      } else if (field === "date") {
        stockReturnSizeRefs.current["S"]?.focus();
      } else if (field === "size") {
        const sizeIndex = SIZES.indexOf(SIZES[index]);
        if (sizeIndex < SIZES.length - 1) {
          stockReturnSizeRefs.current[SIZES[sizeIndex + 1]]?.focus();
        } else {
          handleSaveStockReturnRow();
        }
      }
    }
  };

  const handleCancelStockReturn = () => {
    setIsCreatingStockReturn(false);
    setNewStockReturnedRow({
      dno: "",
      type: "",
      color: "",
      mrp: 0,
      date: new Date().toISOString().split("T")[0],
      sizes: {
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0,
        "3XL": 0,
        "4XL": 0,
        "5XL": 0,
        "6XL": 0,
      },
    });
  };

  const downloadStockReturnEntries = () => {
    const excelData = stockReturnedRows.flatMap((row) =>
      SIZES.map((size, index) => ({
        "DNO": index === 0 ? row.dno : "",
        "Type": index === 0 ? row.type : "",
        "Color": index === 0 ? row.color : "",
        "MRP": index === 0 ? row.mrp : "",
        "Date": index === 0 ? row.date : "",
        "Size": size,
        "Quantity": row.sizes[size] || 0,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Return");

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
    ];

    const fileName = `Stock_Returned_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getTransferHistoryGroups = (rows: SampleRow[]) => {
    const groups = new Map<string, { dno: string; colors: Map<string, SampleRow[]> }>();

    rows.forEach((row) => {
      const dno = normalizeDesignNumber(row.dno || "");
      const color = normalizeColor(row.color || "");
      const groupKey = dno || row.dno || "UNKNOWN";
      const colorKey = color || row.color || "UNKNOWN";

      if (!groups.has(groupKey)) {
        groups.set(groupKey, { dno: groupKey, colors: new Map() });
      }

      const dnoGroup = groups.get(groupKey)!;

      if (!dnoGroup.colors.has(colorKey)) {
        dnoGroup.colors.set(colorKey, []);
      }

      dnoGroup.colors.get(colorKey)!.push(row);
    });

    return Array.from(groups.values())
      .sort((left, right) => left.dno.localeCompare(right.dno))
      .map((group) => ({
        ...group,
        colors: Array.from(group.colors.entries())
          .map(([color, rowsForColor]) => {
            const sizeTotals = SIZES.reduce<{ [size: string]: number }>((accumulator, size) => {
              accumulator[size] = rowsForColor.reduce(
                (sum, row) => sum + (Number(row.sizes[size]) || 0),
                0
              );
              return accumulator;
            }, {});

            const totalQuantity = Object.values(sizeTotals).reduce((sum, qty) => sum + qty, 0);

            return {
              color,
              sizeTotals,
              totalQuantity,
              latestDate: rowsForColor
                .map((row) => row.date)
                .filter(Boolean)
                .sort()
                .slice(-1)[0] || "",
            };
          })
          .sort((left, right) => left.color.localeCompare(right.color)),
      }));
  };

  const transferHistoryGroups = getTransferHistoryGroups(stockReturnedRows);

  const stockGroups = shopInventoryRows.reduce((acc, item) => {
    const dno = normalizeDesignNumber(item.designNumber || "");
    const color = normalizeColor(item.color || "");
    const size = normalizeSizeKey(item.size || "");
    const quantity = Number(item.net ?? item.import ?? 0) || 0;

    if (!dno || !color || !size) return acc;

    if (!acc[dno]) {
      acc[dno] = {
        dno,
        colors: {},
      };
    }

    if (!acc[dno].colors[color]) {
      acc[dno].colors[color] = {
        color,
        sizeTotals: SIZES.reduce<{ [size: string]: number }>((sizes, currentSize) => {
          sizes[currentSize] = 0;
          return sizes;
        }, {}),
        totalQuantity: 0,
      };
    }

    if (acc[dno].colors[color].sizeTotals.hasOwnProperty(size)) {
      acc[dno].colors[color].sizeTotals[size] += quantity;
      acc[dno].colors[color].totalQuantity += quantity;
    }

    return acc;
  }, {} as Record<string, { dno: string; colors: Record<string, { color: string; sizeTotals: Record<string, number>; totalQuantity: number }> }>);

  const stockGroupsList = Object.values(stockGroups)
    .map((group) => ({
      ...group,
      colors: Object.values(group.colors)
        .filter((colorGroup) => colorGroup.totalQuantity > 0)
        .sort((a, b) => a.color.localeCompare(b.color)),
    }))
    .filter((group) => group.colors.length > 0)
    .sort((a, b) => a.dno.localeCompare(b.dno));

  const totalPieces = stockReturnedRows.reduce(
    (sum, row) => sum + Object.values(row.sizes).reduce((rowSum, qty) => rowSum + (Number(qty) || 0), 0),
    0
  );

  const totalShopStock = stockGroupsList.reduce(
    (sum, group) => sum + group.colors.reduce((groupSum, colorGroup) => groupSum + colorGroup.totalQuantity, 0),
    0
  );

  const totalTransferred = transferHistoryGroups.reduce(
    (sum, group) => sum + group.colors.reduce((groupSum, colorGroup) => groupSum + colorGroup.totalQuantity, 0),
    0
  );

  const isGroupSelected = (groupDno: string) => {
    const group = stockGroupsList.find((item) => item.dno === groupDno);

    if (!group || group.colors.length === 0) return false;

    return group.colors.every((colorGroup) => selectedColors[`${groupDno}__${colorGroup.color}`]);
  };

  const toggleDnoSelection = (groupDno: string) => {
    const group = stockGroupsList.find((item) => item.dno === groupDno);
    if (!group) return;

    const shouldSelectAll = !isGroupSelected(groupDno);

    setSelectedColors((prev) => {
      const next = { ...prev };

      group.colors.forEach((colorGroup) => {
        next[`${groupDno}__${colorGroup.color}`] = shouldSelectAll;
      });

      return next;
    });
  };

  const toggleColorSelection = (groupDno: string, color: string) => {
    const key = `${groupDno}__${color}`;
    setSelectedColors((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getSelectedItems = () => {
    const items: { dno: string; color: string }[] = [];

    stockGroupsList.forEach((group) => {
      group.colors.forEach((colorGroup) => {
        if (selectedColors[`${group.dno}__${colorGroup.color}`]) {
          items.push({
            dno: group.dno,
            color: colorGroup.color,
          });
        }
      });
    });

    return items;
  };

  const handleTransferSelected = async () => {
    try {
      const transfers = [];

      for (const group of stockGroupsList) {
        for (const colorGroup of group.colors) {
          const key = `${group.dno}__${colorGroup.color}`;

          if (!selectedColors[key]) continue;

          const items = SIZES
            .map((size) => ({
              size,
              qty: colorGroup.sizeTotals[size] || 0,
            }))
            .filter((item) => item.qty > 0);

          const totalQuantity = items.reduce(
            (sum, item) => sum + item.qty,
            0
          );

          transfers.push({
            dno: group.dno,
            color: colorGroup.color,
            items,
            totalQuantity,
            date: new Date().toISOString(),
          });
        }
      }

      if (transfers.length === 0) {
        alert("Please select at least one color.");
        return;
      }

      // Send one request per selected color
      for (const transfer of transfers) {
        await api.post("/stock-returned", transfer);
      }

      // Refresh inventory
      await recalculateShopInventory();
      await fetchAllStockData();

      // Clear selection
      setSelectedColors({});

      alert("Transfer completed successfully.");
    } catch (error) {
      console.error(error);
      alert("Transfer failed.");
    }
  };

  const toggleGroupExpansion = (groupDno: string) => {
    setExpandedDnos((prev) => ({
      ...prev,
      [groupDno]: !prev[groupDno],
    }));
  };

  const handleImportStockReturnEntries = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("📊 Excel data parsed:", jsonData.length, "rows");
      if (jsonData.length > 0) {
        console.log("Sample row:", jsonData[0]);
        console.log("Columns:", Object.keys(jsonData[0] as any));
      }

      const groupedData: SampleRow[] = [];
      let skippedRows = 0;

      // Check if this is wide format (size columns) or long format (Size + Quantity columns)
      const firstRow = jsonData[0] as any;
      const hasWideSizeColumns = jsonData.length > 0 &&
        (firstRow?.hasOwnProperty('S') || firstRow?.hasOwnProperty('s') ||
          firstRow?.hasOwnProperty('M') || firstRow?.hasOwnProperty('m'));

      if (hasWideSizeColumns) {
        console.log("✅ Detected WIDE format (size columns: S, M, L, XL, etc.)");

        // Wide format: One row per item with size columns
        jsonData.forEach((row: any, index: number) => {
          const dno = normalizeDesignNumber(
            row.DNO?.toString() || row.dno?.toString() || row.Dno?.toString() || ""
          );
          const type = (
            row.Type?.toString() || row.type?.toString() || row.TYPE?.toString() || ""
          ).trim();
          const color = normalizeColor(
            row.Color?.toString() || row.color?.toString() || row.COLOR?.toString() || ""
          );

          // Parse date - handle Excel serial numbers and string dates
          let date = new Date().toISOString().split("T")[0];
          const dateValue = row.Date || row.date || row.DATE;
          if (dateValue) {
            if (typeof dateValue === 'number') {
              // Excel serial date number
              const excelDate = XLSX.SSF.parse_date_code(dateValue);
              date = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            } else {
              // Try parsing as string
              const parsedDate = new Date(dateValue.toString());
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString().split("T")[0];
              } else {
                date = dateValue.toString().trim();
              }
            }
          }

          const mrp = parseFloat(
            row.MRP?.toString() || row.mrp?.toString() || row.Mrp?.toString() || "0"
          ) || 0;

          // Read size quantities from columns
          const sizes: SampleRow["sizes"] = {
            S: parseInt(row.S?.toString() || row.s?.toString() || "0") || 0,
            M: parseInt(row.M?.toString() || row.m?.toString() || "0") || 0,
            L: parseInt(row.L?.toString() || row.l?.toString() || "0") || 0,
            XL: parseInt(row.XL?.toString() || row.xl?.toString() || row.Xl?.toString() || "0") || 0,
            XXL: parseInt(row.XXL?.toString() || row.xxl?.toString() || row.Xxl?.toString() || row["2XL"]?.toString() || "0") || 0,
            "3XL": parseInt(row["3XL"]?.toString() || row["3xl"]?.toString() || "0") || 0,
            "4XL": parseInt(row["4XL"]?.toString() || row["4xl"]?.toString() || "0") || 0,
            "5XL": parseInt(row["5XL"]?.toString() || row["5xl"]?.toString() || "0") || 0,
            "6XL": parseInt(row["6XL"]?.toString() || row["6xl"]?.toString() || "0") || 0,
          };

          const totalQty = Object.values(sizes).reduce((a, b) => a + b, 0);

          console.log(`Row ${index + 1}:`, { dno, type, color, mrp, date, totalQty });

          if (dno && color && totalQty > 0) {
            groupedData.push({
              dno,
              type,
              color,
              date,
              mrp,
              sizes,
            });
          } else {
            skippedRows++;
            console.warn(`⚠️ Skipped row ${index + 1}: missing required fields or no quantities`, { dno, color, totalQty });
          }
        });
      } else {
        console.log("✅ Detected LONG format (Size and Quantity columns)");

        // Long format: Multiple rows per item with Size and Quantity columns
        const tempGrouped: { [key: string]: SampleRow } = {};

        jsonData.forEach((row: any, index: number) => {
          const dno = normalizeDesignNumber(
            row.DNO?.toString() || row.dno?.toString() || row.Dno?.toString() || ""
          );
          const type = (
            row.Type?.toString() || row.type?.toString() || row.TYPE?.toString() || ""
          ).trim();
          const color = normalizeColor(
            row.Color?.toString() || row.color?.toString() || row.COLOR?.toString() || ""
          );

          // Parse date - handle Excel serial numbers and string dates
          let date = new Date().toISOString().split("T")[0];
          const dateValue = row.Date || row.date || row.DATE;
          if (dateValue) {
            if (typeof dateValue === 'number') {
              // Excel serial date number
              const excelDate = XLSX.SSF.parse_date_code(dateValue);
              date = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            } else {
              // Try parsing as string
              const parsedDate = new Date(dateValue.toString());
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString().split("T")[0];
              } else {
                date = dateValue.toString().trim();
              }
            }
          }

          const size = normalizeSizeKey(
            row.Size?.toString() || row.size?.toString() || row.SIZE?.toString() || ""
          );
          const qty = parseInt(
            row.Quantity?.toString() || row.quantity?.toString() || row.QUANTITY?.toString() ||
            row.Qty?.toString() || row.qty?.toString() || row.QTY?.toString() || "0"
          ) || 0;
          const mrp = parseFloat(
            row.MRP?.toString() || row.mrp?.toString() || row.Mrp?.toString() || "0"
          ) || 0;

          console.log(`Row ${index + 1}:`, { dno, type, color, size, qty, mrp });

          if (dno && color && size && qty > 0) {
            const key = `${dno}_${color}`;

            if (!tempGrouped[key]) {
              tempGrouped[key] = {
                dno,
                type,
                color,
                date,
                mrp: mrp,
                sizes: {
                  S: 0,
                  M: 0,
                  L: 0,
                  XL: 0,
                  XXL: 0,
                  "3XL": 0,
                  "4XL": 0,
                  "5XL": 0,
                  "6XL": 0,
                },
              };
            } else {
              if (type && !tempGrouped[key].type) tempGrouped[key].type = type;
              if (mrp > 0) tempGrouped[key].mrp = mrp;
            }

            if (tempGrouped[key].sizes.hasOwnProperty(size)) {
              tempGrouped[key].sizes[size] += qty;
            }
          } else {
            skippedRows++;
            console.warn(`⚠️ Skipped row ${index + 1}: missing required fields`, { dno, color, size, qty });
          }
        });

        groupedData.push(...Object.values(tempGrouped));
      }

      console.log(`✅ Processed ${groupedData.length} entries`);
      console.log(`⚠️ Skipped ${skippedRows} rows`);

      if (groupedData.length === 0) {
        alert(`No valid entries found in Excel file!\n\nRequired columns:\n- Wide format: DNO, Color, and size columns (S, M, L, XL, etc.)\n- Long format: DNO, Color, Size, Quantity\n\nOptional: Type, MRP, Date\n\nSkipped ${skippedRows} rows due to missing data.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Save to backend
      for (const row of groupedData) {
        const totalQty = Object.values(row.sizes).reduce((a, b) => a + b, 0);

        const dataToSave = {
          dno: row.dno,
          type: row.type,
          color: row.color,
          mrp: row.mrp,
          date: row.date,
          items: Object.entries(row.sizes)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => ({ size: normalizeSizeKey(size), qty, mrp: row.mrp })),
          totalQuantity: totalQty,
        };

        await api.post("/stock-returned", dataToSave);
      }

      await recalculateShopInventory();

      // Refresh data
      fetchAllStockData();
      alert(`Successfully imported ${groupedData.length} entries!`);
    } catch (error) {
      console.error("Error importing stock return entries:", error);
      alert(`Failed to import stock return entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-0 text-sm font-medium text-gray-700">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zm0 10l-8 4-8-4m16-5l-8 4-8-4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Stock Manager</h1>
              </div>
            </div>

            <div className="flex items-center gap-5 text-sm text-gray-600">
              <div>
                <span className="mr-1">Stock:</span>
                <span className="font-semibold text-gray-900">{totalShopStock}</span>
              </div>
              <div className="h-5 w-px bg-gray-300" />
              <div>
                <span className="mr-1">Transferred:</span>
                <span className="font-semibold text-gray-900">{totalTransferred}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white px-4 pt-4 sm:px-6">
          <div className="flex items-center gap-8 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("all-stock")}
              className={`flex items-center gap-2 border-b-2 px-2 pb-4 text-sm font-medium transition-colors ${activeTab === "all-stock"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4 8 4 8-4zm0 10l-8 4-8-4m0-10v10" />
              </svg>
              All Stock
            </button>
            <button
              onClick={() => setActiveTab("transfer-history")}
              className={`flex items-center gap-2 border-b-2 px-2 pb-4 text-sm font-medium transition-colors ${activeTab === "transfer-history"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7l-4 4 4 4m10-8l4 4-4 4M3 11h18" />
              </svg>
              Transfer History
            </button>
          </div>
        </div>

        {/* Stock Return Entries Table */}
        <div className={`px-4 py-5 sm:px-6 ${activeTab === "transfer-history" ? "bg-[#fafafa]" : "bg-[#fafafa]"}`}>
          {activeTab === "all-stock" ? (
            <>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-gray-600">Loading entries...</p>
                </div>
              ) : stockGroupsList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500">
                  No stock returned entries. Click "Add Entry" to create one.
                </div>
              ) : (
                <div className="space-y-8">
                  {selectedCount > 0 && (
                    <div className="sticky top-4 z-40 mb-4 flex justify-end">
                      <button
                        onClick={handleTransferSelected}
                        className="rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-700"
                      >
                        Transfer Selected ({selectedCount})
                      </button>
                    </div>
                  )}
                  {stockGroupsList.map((group) => {
                    const dnoChecked = isGroupSelected(group.dno);
                    const isExpanded = expandedDnos[group.dno] ?? true;
                    const totalForGroup = group.colors.reduce((sum, colorGroup) => sum + colorGroup.totalQuantity, 0);

                    return (
                      <div key={group.dno} className="text-sm overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-6">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => toggleGroupExpansion(group.dno)}
                              className="flex h-5 w-5 items-center justify-center text-gray-500 transition-transform hover:text-gray-700"
                              aria-label={isExpanded ? "Collapse group" : "Expand group"}
                            >
                              <svg
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M5.23 7.21a1 1 0 011.4.02L10 10.585l3.37-3.355a1 1 0 111.4 1.42l-4.07 4.05a1 1 0 01-1.4 0l-4.05-4.03a1 1 0 01-.02-1.4z" />
                              </svg>
                            </button>
                            <input
                              type="checkbox"
                              checked={dnoChecked}
                              onChange={() => toggleDnoSelection(group.dno)}
                              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <div className="flex items-center gap-4 text-md">
                              <div className="uppercase tracking-[0.2em] text-gray-500">DNO</div>
                              <div className="font-black leading-none text-gray-900">{group.dno}</div>
                              <div className="font-medium text-gray-500">{group.colors.length} colors</div>
                            </div>
                          </div>
                          <div className="font-mono text-[26px] font-normal tracking-tight text-teal-600">
                            {totalForGroup} <span className="text-[18px]">pcs total</span>
                          </div>
                        </div>

                        {isExpanded ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-100 bg-[#f7f7f7] text-[11px] uppercase tracking-[0.22em] text-gray-500">
                                  <th className="px-6 py-4 text-left">Color</th>
                                  {SIZES.map((size) => (
                                    <th key={size} className="px-4 py-4 text-center">{size}</th>
                                  ))}
                                  <th className="px-6 py-4 text-center">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.from(group.colors.values()).map((colorGroup) => {
                                  const colorKey = `${group.dno}__${colorGroup.color}`;
                                  const colorChecked = !!selectedColors[colorKey];

                                  return (
                                    <tr key={colorKey} className="border-b border-gray-100">
                                      <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                          <input
                                            type="checkbox"
                                            checked={colorChecked}
                                            onChange={() => toggleColorSelection(group.dno, colorGroup.color)}
                                            className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                          />
                                          <span className="inline-flex items-center gap-3 text-md font-medium text-gray-900">
                                            <span className={`h-3.5 w-3.5 rounded-full ${getColorDotClass(colorGroup.color)}`} />
                                            {colorGroup.color}
                                          </span>
                                        </div>
                                      </td>
                                      {SIZES.map((size) => {
                                        const quantity = colorGroup.sizeTotals[size] || 0;
                                        return (
                                          <td key={size} className="px-4 py-6 text-center text-md font-medium text-gray-900">
                                            {quantity || <span className="text-gray-300">-</span>}
                                          </td>
                                        );
                                      })}
                                      <td className="px-6 py-6 text-center text-[16px] font-bold text-teal-600">
                                        {colorGroup.totalQuantity}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading transfer history...</p>
            </div>
          ) : (
            <>
              {transferHistoryGroups.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center text-gray-500">
                  No transfer history available yet.
                </div>
              ) : (
                <div className="space-y-8">
                  {transferHistoryGroups.map((group) => {
                    const isExpanded = expandedDnos[group.dno] ?? true;
                    const totalForGroup = group.colors.reduce(
                      (sum, colorGroup) => sum + colorGroup.totalQuantity,
                      0
                    );

                    return (
                      <div
                        key={group.dno}
                        className="overflow-hidden rounded-[20px] border border-gray-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-6">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => toggleGroupExpansion(group.dno)}
                              className="flex h-5 w-5 items-center justify-center text-gray-500 transition-transform hover:text-gray-700"
                            >
                              <svg
                                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""
                                  }`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M5.23 7.21a1 1 0 011.4.02L10 10.585l3.37-3.355a1 1 0 111.4 1.42l-4.07 4.05a1 1 0 01-1.4 0l-4.05-4.03a1 1 0 01-.02-1.4z" />
                              </svg>
                            </button>

                            <div className="flex items-center gap-4 text-md">
                              <div className="uppercase tracking-[0.2em] text-gray-500">
                                DNO
                              </div>

                              <div className="font-black leading-none text-gray-900">
                                {group.dno}
                              </div>

                              <div className="font-medium text-gray-500">
                                {group.colors.length} colors
                              </div>
                            </div>
                          </div>

                          <div className="font-mono text-[26px] font-normal tracking-tight text-teal-600">
                            {totalForGroup}
                            <span className="text-[18px]"> pcs total</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-gray-100 bg-[#f7f7f7] text-[11px] uppercase tracking-[0.22em] text-gray-500">
                                  <th className="px-6 py-4 text-left">Color</th>

                                  {SIZES.map((size) => (
                                    <th
                                      key={size}
                                      className="px-4 py-4 text-center"
                                    >
                                      {size}
                                    </th>
                                  ))}

                                  <th className="px-6 py-4 text-center">
                                    Total
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {group.colors.map((colorGroup) => (
                                  <tr
                                    key={`${group.dno}-${colorGroup.color}`}
                                    className="border-b border-gray-100"
                                  >
                                    <td className="px-6 py-6">
                                      <span className="inline-flex items-center gap-3 text-md font-medium text-gray-900">
                                        <span
                                          className={`h-3.5 w-3.5 rounded-full ${getColorDotClass(
                                            colorGroup.color
                                          )}`}
                                        />
                                        {colorGroup.color}
                                      </span>
                                    </td>

                                    {SIZES.map((size) => {
                                      const quantity =
                                        colorGroup.sizeTotals[size] || 0;

                                      return (
                                        <td
                                          key={size}
                                          className="px-4 py-6 text-center text-md font-medium text-gray-900"
                                        >
                                          {quantity || (
                                            <span className="text-gray-300">-</span>
                                          )}
                                        </td>
                                      );
                                    })}

                                    <td className="px-6 py-6 text-center text-lg font-bold text-teal-600">
                                      {colorGroup.totalQuantity}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
              }
            </>
          )}
        </div>
      </div>
    </div>
  );
}
