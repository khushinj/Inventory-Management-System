"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";
import * as XLSX from "xlsx";

type Entry = {
  _id: string;
  dno?: string;
  type?: string;
  color?: string;
  size?: string;
  qty: number;
  mrp?: number;
  date?: string;
  formType?: string;
  receiver?: string;
  supplier?: string;
  transferType?: string;
  channel?: string;
  domain: string;
  warehouseType?: string;
};

type SampleRow = {
  dno: string;
  color: string;
  sizes: {
    [size: string]: number;
  };
};

function DomesticDashboard() {
  const searchParams = useSearchParams();
  const formTypeParam = searchParams.get("formType");
  const transferTypeParam = searchParams.get("transferType");
  const isLockedParam = searchParams.get("locked") === "true";
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState<string>(formTypeParam || "dispatch");
  const [isFormTypeLocked] = useState<boolean>(isLockedParam);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [pendingFormType, setPendingFormType] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    dno: "",
    type: "",
    color: "",
    size: "",
    qty: "",
    mrp: "",
    date: "",
    formType: "",
    receiver: "",
    supplier: "",
    transferType: "",
    channel: "",
  });

  const dnoRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const mrpRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const additionalFieldRef = useRef<HTMLInputElement>(null);

  // Refs for new format forms
  const sampleDnoRef = useRef<HTMLInputElement>(null);
  const sampleColorRef = useRef<HTMLInputElement>(null);
  const sampleSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const productionDnoRef = useRef<HTMLInputElement>(null);
  const productionColorRef = useRef<HTMLInputElement>(null);
  const productionSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const purchaseDnoRef = useRef<HTMLInputElement>(null);
  const purchaseColorRef = useRef<HTMLInputElement>(null);
  const purchaseSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const dispatchDnoRef = useRef<HTMLInputElement>(null);
  const dispatchColorRef = useRef<HTMLInputElement>(null);
  const dispatchSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const [channelOptions] = useState<string[]>([
    "online",
    "domestic return",
    "online return",
  ]);
  const [transferOptions] = useState<string[]>([
    "inwards",
    "outwards",
  ]);
  const [filteredChannelOptions, setFilteredChannelOptions] = useState<string[]>(channelOptions);
  const [filteredTransferOptions, setFilteredTransferOptions] = useState<string[]>(transferOptions);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [showTransferDropdown, setShowTransferDropdown] = useState(false);
  
  // State for sample/production/purchase forms' new format
  const [sampleRows, setSampleRows] = useState<SampleRow[]>([]);
  const [productionRows, setProductionRows] = useState<SampleRow[]>([]);
  const [purchaseRows, setPurchaseRows] = useState<SampleRow[]>([]);
  const [isCreatingSample, setIsCreatingSample] = useState(false);
  const [isCreatingProduction, setIsCreatingProduction] = useState(false);
  const [isCreatingPurchase, setIsCreatingPurchase] = useState(false);
  const [editingSampleRow, setEditingSampleRow] = useState<string | null>(null);
  const [editingProductionRow, setEditingProductionRow] = useState<string | null>(null);
  const [editingPurchaseRow, setEditingPurchaseRow] = useState<string | null>(null);
  const [newSampleRow, setNewSampleRow] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });
  const [newProductionRow, setNewProductionRow] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });
  const [newPurchaseRow, setNewPurchaseRow] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });
  const [editSampleForm, setEditSampleForm] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });
  const [editProductionForm, setEditProductionForm] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });
  const [editPurchaseForm, setEditPurchaseForm] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });

  // State for dispatch form's new format
  const [dispatchRows, setDispatchRows] = useState<SampleRow[]>([]);
  const [isCreatingDispatch, setIsCreatingDispatch] = useState(false);
  const [editingDispatchRow, setEditingDispatchRow] = useState<string | null>(null);
  const [newDispatchRow, setNewDispatchRow] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });
  const [editDispatchForm, setEditDispatchForm] = useState<SampleRow>({
    dno: "",
    color: "",
    sizes: {}
  });

  const SAMPLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    if (selectedFormType === "sample" && entries.length > 0) {
      groupSampleEntries(entries);
    } else if (selectedFormType === "production" && entries.length > 0) {
      groupProductionEntries(entries);
    } else if (selectedFormType === "purchase" && entries.length > 0) {
      groupPurchaseEntries(entries);
    } else if (selectedFormType === "dispatch" && entries.length > 0) {
      groupDispatchEntries(entries);
    }
  }, [selectedFormType, entries]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const domesticRes = await api.get("/warehouse/domestic");
      setEntries(domesticRes.data);
      
      // Group entries for sample/production/purchase/dispatch view
      if (selectedFormType === "sample") {
        groupSampleEntries(domesticRes.data);
      } else if (selectedFormType === "production") {
        groupProductionEntries(domesticRes.data);
      } else if (selectedFormType === "purchase") {
        groupPurchaseEntries(domesticRes.data);
      } else if (selectedFormType === "dispatch") {
        groupDispatchEntries(domesticRes.data);
      }
    } catch (err: unknown) {
      console.error("Error fetching entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupSampleEntries = (allEntries: Entry[]) => {
    const sampleEntries = allEntries.filter(entry => entry.formType === "sample");
    const grouped: { [key: string]: SampleRow } = {};
    
    sampleEntries.forEach(entry => {
      if (entry.dno && entry.color && entry.size) {
        const key = `${entry.dno}_${entry.color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno: entry.dno,
            color: entry.color,
            sizes: {}
          };
        }
        // Normalize 2xl to XXL
        const normalizedSize = entry.size.toLowerCase() === '2xl' ? 'XXL' : entry.size;
        grouped[key].sizes[normalizedSize] = entry.qty;
      }
    });
    
    setSampleRows(Object.values(grouped));
  };

  const groupProductionEntries = (allEntries: Entry[]) => {
    const productionEntries = allEntries.filter(entry => entry.formType === "production");
    const grouped: { [key: string]: SampleRow } = {};
    
    productionEntries.forEach(entry => {
      if (entry.dno && entry.color && entry.size) {
        const key = `${entry.dno}_${entry.color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno: entry.dno,
            color: entry.color,
            sizes: {}
          };
        }
        // Normalize 2xl to XXL
        const normalizedSize = entry.size.toLowerCase() === '2xl' ? 'XXL' : entry.size;
        grouped[key].sizes[normalizedSize] = entry.qty;
      }
    });
    
    setProductionRows(Object.values(grouped));
  };

  const groupPurchaseEntries = (allEntries: Entry[]) => {
    const purchaseEntries = allEntries.filter(entry => entry.formType === "purchase");
    const grouped: { [key: string]: SampleRow } = {};
    
    purchaseEntries.forEach(entry => {
      if (entry.dno && entry.color && entry.size) {
        const key = `${entry.dno}_${entry.color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno: entry.dno,
            color: entry.color,
            sizes: {}
          };
        }
        // Normalize 2xl to XXL
        const normalizedSize = entry.size.toLowerCase() === '2xl' ? 'XXL' : entry.size;
        grouped[key].sizes[normalizedSize] = entry.qty;
      }
    });
    
    setPurchaseRows(Object.values(grouped));
  };

  const groupDispatchEntries = (allEntries: Entry[]) => {
    const dispatchEntries = allEntries.filter(entry => entry.formType === "dispatch");
    const grouped: { [key: string]: SampleRow } = {};
    
    dispatchEntries.forEach(entry => {
      if (entry.dno && entry.color && entry.size) {
        const key = `${entry.dno}_${entry.color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno: entry.dno,
            color: entry.color,
            sizes: {}
          };
        }
        // Normalize 2xl to XXL
        const normalizedSize = entry.size.toLowerCase() === '2xl' ? 'XXL' : entry.size;
        grouped[key].sizes[normalizedSize] = entry.qty;
      }
    });
    
    setDispatchRows(Object.values(grouped));
  };

  const filteredEntries = entries
    .filter((entry) => {
      const matchesSearch =
        entry.dno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.formType?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFormType =
        entry.formType === selectedFormType;

      return matchesSearch && matchesFormType;
    });

  // Filter grouped rows (sample, production, purchase, dispatch) by search term
  const filterGroupedRows = (rows: SampleRow[]) => {
    if (!searchTerm) return rows;
    return rows.filter((row) => 
      row.dno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.color?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const filteredSampleRows = filterGroupedRows(sampleRows);
  const filteredProductionRows = filterGroupedRows(productionRows);
  const filteredPurchaseRows = filterGroupedRows(purchaseRows);
  const filteredDispatchRows = filterGroupedRows(dispatchRows);

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry._id);
    setEditForm({
      dno: entry.dno || "",
      type: entry.type || "",
      color: entry.color || "",
      size: entry.size || "",
      qty: entry.qty?.toString() || "",
      mrp: entry.mrp?.toString() || "",
      date: entry.date?.split("T")[0] || "",
      formType: entry.formType || "",
      receiver: entry.receiver || "",
      supplier: entry.supplier || "",
      transferType: entry.transferType || "",
      channel: entry.channel || "",
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      const payload = {
        dno: editForm.dno,
        type: editForm.type,
        color: editForm.color,
        size: editForm.size,
        qty: Number(editForm.qty),
        ...(editForm.mrp && { mrp: Number(editForm.mrp) }),
        date: editForm.date,
        formType: editForm.formType || "dispatch",
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
        ...(editForm.channel && { channel: editForm.channel }),
      };
      
      await api.patch(`/warehouse/domestic/${id}`, payload);
      setEditingEntry(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating entry:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to update entry: " + (axiosError || errorMsg));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await api.delete(`/warehouse/domestic/${id}`);
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting entry:", err);
        alert("Failed to delete entry");
      }
    }
  };

  const handleCreate = () => {
    if ((selectedFormType === "transfer inwards" || selectedFormType === "transfer outwards") && !selectedWarehouse) {
      setShowWarehouseModal(true);
      return;
    }
    
    if (selectedFormType === "sample") {
      setNewSampleRow({
        dno: "",
        color: "",
        sizes: {}
      });
      setIsCreatingSample(true);
      setTimeout(() => sampleDnoRef.current?.focus(), 100);
    } else if (selectedFormType === "production") {
      setNewProductionRow({
        dno: "",
        color: "",
        sizes: {}
      });
      setIsCreatingProduction(true);
      setTimeout(() => productionDnoRef.current?.focus(), 100);
    } else if (selectedFormType === "purchase") {
      setNewPurchaseRow({
        dno: "",
        color: "",
        sizes: {}
      });
      setIsCreatingPurchase(true);
      setTimeout(() => purchaseDnoRef.current?.focus(), 100);
    } else if (selectedFormType === "dispatch") {
      setNewDispatchRow({
        dno: "",
        color: "",
        sizes: {}
      });
      setIsCreatingDispatch(true);
      setTimeout(() => dispatchDnoRef.current?.focus(), 100);
    } else {
      setEditForm({
        dno: "",
        type: "",
        color: "",
        size: "",
        qty: "",
        mrp: "",
        date: new Date().toISOString().split("T")[0],
        formType: selectedFormType,
        receiver: "",
        supplier: "",
        transferType: transferTypeParam || "",
        channel: selectedWarehouse || "",
      });
      setIsCreating(true);
    }
  };

  const handleSaveSampleRow = async () => {
    try {
      // Create individual entries for each size with quantity
      const promises = SAMPLE_SIZES.map(size => {
        const qty = newSampleRow.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: newSampleRow.dno,
            type: "",
            color: newSampleRow.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "sample",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      
      // Reset form and refocus for next entry
      setNewSampleRow({
        dno: "",
        color: "",
        sizes: {}
      });
      fetchEntries();
      setTimeout(() => sampleDnoRef.current?.focus(), 100);
    } catch (err: unknown) {
      console.error("Error creating sample entries:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to create sample entries: " + (axiosError || errorMsg));
    }
  };

  const handleCancelSample = () => {
    setIsCreatingSample(false);
    setNewSampleRow({
      dno: "",
      color: "",
      sizes: {}
    });
  };

  const handleSaveProductionRow = async () => {
    try {
      // Create individual entries for each size with quantity
      const promises = SAMPLE_SIZES.map(size => {
        const qty = newProductionRow.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: newProductionRow.dno,
            type: "",
            color: newProductionRow.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "production",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      
      // Reset form and refocus for next entry
      setNewProductionRow({
        dno: "",
        color: "",
        sizes: {}
      });
      fetchEntries();
      setTimeout(() => productionDnoRef.current?.focus(), 100);
    } catch (err: unknown) {
      console.error("Error creating production entries:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to create production entries: " + (axiosError || errorMsg));
    }
  };

  const handleCancelProduction = () => {
    setIsCreatingProduction(false);
    setNewProductionRow({
      dno: "",
      color: "",
      sizes: {}
    });
  };

  const handleSavePurchaseRow = async () => {
    try {
      // Create individual entries for each size with quantity
      const promises = SAMPLE_SIZES.map(size => {
        const qty = newPurchaseRow.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: newPurchaseRow.dno,
            type: "",
            color: newPurchaseRow.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "purchase",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      
      // Reset form and refocus for next entry
      setNewPurchaseRow({
        dno: "",
        color: "",
        sizes: {}
      });
      fetchEntries();
      setTimeout(() => purchaseDnoRef.current?.focus(), 100);
    } catch (err: unknown) {
      console.error("Error creating purchase entries:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to create purchase entries: " + (axiosError || errorMsg));
    }
  };

  const handleCancelPurchase = () => {
    setIsCreatingPurchase(false);
    setNewPurchaseRow({
      dno: "",
      color: "",
      sizes: {}
    });
  };

  // Edit handlers for new format
  const handleEditSampleRow = (row: SampleRow) => {
    const key = `${row.dno}_${row.color}`;
    setEditingSampleRow(key);
    setEditSampleForm({...row});
  };

  const handleEditProductionRow = (row: SampleRow) => {
    const key = `${row.dno}_${row.color}`;
    setEditingProductionRow(key);
    setEditProductionForm({...row});
  };

  const handleEditPurchaseRow = (row: SampleRow) => {
    const key = `${row.dno}_${row.color}`;
    setEditingPurchaseRow(key);
    setEditPurchaseForm({...row});
  };

  // Update handlers for new format
  const handleUpdateSampleRow = async (originalRow: SampleRow) => {
    try {
      // Delete old entries for this dno+color combination
      const entriesToDelete = entries.filter(e => 
        e.formType === "sample" && e.dno === originalRow.dno && e.color === originalRow.color
      );
      
      await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
      
      // Create new entries with updated quantities
      const promises = SAMPLE_SIZES.map(size => {
        const qty = editSampleForm.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: editSampleForm.dno,
            type: "",
            color: editSampleForm.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "sample",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      setEditingSampleRow(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating sample entries:", err);
      alert("Failed to update sample entries");
    }
  };

  const handleUpdateProductionRow = async (originalRow: SampleRow) => {
    try {
      // Delete old entries for this dno+color combination
      const entriesToDelete = entries.filter(e => 
        e.formType === "production" && e.dno === originalRow.dno && e.color === originalRow.color
      );
      
      await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
      
      // Create new entries with updated quantities
      const promises = SAMPLE_SIZES.map(size => {
        const qty = editProductionForm.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: editProductionForm.dno,
            type: "",
            color: editProductionForm.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "production",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      setEditingProductionRow(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating production entries:", err);
      alert("Failed to update production entries");
    }
  };

  const handleUpdatePurchaseRow = async (originalRow: SampleRow) => {
    try {
      // Delete old entries for this dno+color combination
      const entriesToDelete = entries.filter(e => 
        e.formType === "purchase" && e.dno === originalRow.dno && e.color === originalRow.color
      );
      
      await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
      
      // Create new entries with updated quantities
      const promises = SAMPLE_SIZES.map(size => {
        const qty = editPurchaseForm.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: editPurchaseForm.dno,
            type: "",
            color: editPurchaseForm.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "purchase",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      setEditingPurchaseRow(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating purchase entries:", err);
      alert("Failed to update purchase entries");
    }
  };

  // Delete handlers for new format
  const handleDeleteSampleRow = async (row: SampleRow) => {
    if (window.confirm(`Are you sure you want to delete all entries for ${row.dno} - ${row.color}?`)) {
      try {
        const entriesToDelete = entries.filter(e => 
          e.formType === "sample" && e.dno === row.dno && e.color === row.color
        );
        
        await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting sample entries:", err);
        alert("Failed to delete sample entries");
      }
    }
  };

  const handleDeleteProductionRow = async (row: SampleRow) => {
    if (window.confirm(`Are you sure you want to delete all entries for ${row.dno} - ${row.color}?`)) {
      try {
        const entriesToDelete = entries.filter(e => 
          e.formType === "production" && e.dno === row.dno && e.color === row.color
        );
        
        await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting production entries:", err);
        alert("Failed to delete production entries");
      }
    }
  };

  const handleDeletePurchaseRow = async (row: SampleRow) => {
    if (window.confirm(`Are you sure you want to delete all entries for ${row.dno} - ${row.color}?`)) {
      try {
        const entriesToDelete = entries.filter(e => 
          e.formType === "purchase" && e.dno === row.dno && e.color === row.color
        );
        
        await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting purchase entries:", err);
        alert("Failed to delete purchase entries");
      }
    }
  };

  // Dispatch Row Handlers
  const handleSaveDispatchRow = async () => {
    try {
      // Create individual entries for each size with quantity
      const promises = SAMPLE_SIZES.map(size => {
        const qty = newDispatchRow.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: newDispatchRow.dno,
            type: "",
            color: newDispatchRow.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "dispatch",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      setIsCreatingDispatch(false);
      setNewDispatchRow({
        dno: "",
        color: "",
        sizes: {}
      });
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error saving dispatch entries:", err);
      alert("Failed to save dispatch entries");
    }
  };

  const handleEditDispatchRow = (row: SampleRow) => {
    setEditingDispatchRow(`${row.dno}_${row.color}`);
    setEditDispatchForm(row);
  };

  const handleUpdateDispatchRow = async (originalRow: SampleRow) => {
    try {
      // Delete old entries for this dno+color combination
      const entriesToDelete = entries.filter(e => 
        e.formType === "dispatch" && e.dno === originalRow.dno && e.color === originalRow.color
      );
      
      await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
      
      // Create new entries with updated quantities
      const promises = SAMPLE_SIZES.map(size => {
        const qty = editDispatchForm.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/warehouse/domestic", {
            dno: editDispatchForm.dno,
            type: "",
            color: editDispatchForm.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "dispatch",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      setEditingDispatchRow(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating dispatch entries:", err);
      alert("Failed to update dispatch entries");
    }
  };

  const handleDeleteDispatchRow = async (row: SampleRow) => {
    if (window.confirm(`Are you sure you want to delete all entries for ${row.dno} - ${row.color}?`)) {
      try {
        const entriesToDelete = entries.filter(e => 
          e.formType === "dispatch" && e.dno === row.dno && e.color === row.color
        );
        
        await Promise.all(entriesToDelete.map(e => api.delete(`/warehouse/domestic/${e._id}`)));
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting dispatch entries:", err);
        alert("Failed to delete dispatch entries");
      }
    }
  };

  const handleCancelDispatch = () => {
    setIsCreatingDispatch(false);
    setNewDispatchRow({
      dno: "",
      color: "",
      sizes: {}
    });
  };

  // Keyboard navigation for new format forms
  const handleSampleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentField === 'dno') {
        sampleColorRef.current?.focus();
      } else if (currentField === 'color') {
        sampleSizeRefs.current['S']?.focus();
      } else if (currentField.startsWith('size-')) {
        const size = currentField.replace('size-', '');
        const currentIndex = SAMPLE_SIZES.indexOf(size);
        if (currentIndex < SAMPLE_SIZES.length - 1) {
          const nextSize = SAMPLE_SIZES[currentIndex + 1];
          sampleSizeRefs.current[nextSize]?.focus();
        } else {
          // Last size field, save the entry
          handleSaveSampleRow();
        }
      }
    }
  };

  const handleProductionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentField === 'dno') {
        productionColorRef.current?.focus();
      } else if (currentField === 'color') {
        productionSizeRefs.current['S']?.focus();
      } else if (currentField.startsWith('size-')) {
        const size = currentField.replace('size-', '');
        const currentIndex = SAMPLE_SIZES.indexOf(size);
        if (currentIndex < SAMPLE_SIZES.length - 1) {
          const nextSize = SAMPLE_SIZES[currentIndex + 1];
          productionSizeRefs.current[nextSize]?.focus();
        } else {
          // Last size field, save the entry
          handleSaveProductionRow();
        }
      }
    }
  };

  const handlePurchaseKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentField === 'dno') {
        purchaseColorRef.current?.focus();
      } else if (currentField === 'color') {
        purchaseSizeRefs.current['S']?.focus();
      } else if (currentField.startsWith('size-')) {
        const size = currentField.replace('size-', '');
        const currentIndex = SAMPLE_SIZES.indexOf(size);
        if (currentIndex < SAMPLE_SIZES.length - 1) {
          const nextSize = SAMPLE_SIZES[currentIndex + 1];
          purchaseSizeRefs.current[nextSize]?.focus();
        } else {
          // Last size field, save the entry
          handleSavePurchaseRow();
        }
      }
    }
  };

  const handleDispatchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentField === 'dno') {
        dispatchColorRef.current?.focus();
      } else if (currentField === 'color') {
        dispatchSizeRefs.current['S']?.focus();
      } else if (currentField.startsWith('size-')) {
        const size = currentField.replace('size-', '');
        const currentIndex = SAMPLE_SIZES.indexOf(size);
        if (currentIndex < SAMPLE_SIZES.length - 1) {
          const nextSize = SAMPLE_SIZES[currentIndex + 1];
          dispatchSizeRefs.current[nextSize]?.focus();
        } else {
          // Last size field, save the entry
          handleSaveDispatchRow();
        }
      }
    }
  };

  const handleSaveNew = async () => {
    try {
      const payload = {
        dno: editForm.dno,
        type: editForm.type,
        color: editForm.color,
        size: editForm.size,
        qty: Number(editForm.qty),
        ...(editForm.mrp && { mrp: Number(editForm.mrp) }),
        date: editForm.date,
        formType: selectedFormType,
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
        ...(editForm.channel && { channel: editForm.channel }),
      };
      
      await api.post("/warehouse/domestic", payload);
      setIsCreating(false);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error creating entry:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to create entry: " + (axiosError || errorMsg));
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingEntry(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    nextRef?: React.RefObject<HTMLInputElement | HTMLSelectElement | null>,
    isLastField?: boolean,
    entryId?: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLastField) {
        handleSaveAndContinue(entryId);
      } else {
        nextRef?.current?.focus();
      }
    }
  };

  const handleChannelInputChange = (value: string) => {
    setEditForm({...editForm, channel: value});
    const filtered = channelOptions.filter(option => 
      option.toLowerCase().includes(value.toLowerCase())
    ).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(value.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(value.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
    setFilteredChannelOptions(filtered);
  };

  const handleTransferInputChange = (value: string) => {
    setEditForm({...editForm, transferType: value});
    const filtered = transferOptions.filter(option => 
      option.toLowerCase().includes(value.toLowerCase())
    ).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(value.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(value.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
    setFilteredTransferOptions(filtered);
  };

  const handleFormTypeClick = (type: string) => {
    if (isFormTypeLocked && selectedFormType !== type) return;
    
    if (type === "transfer inwards" || type === "transfer outwards") {
      setPendingFormType(type);
      setSelectedWarehouse(null);
      setShowWarehouseModal(true);
    } else {
      setSelectedFormType(type);
      setSelectedWarehouse(null);
    }
  };

  const handleWarehouseSelect = (warehouse: string) => {
    setSelectedWarehouse(warehouse);
    setEditForm({...editForm, channel: warehouse});
    
    if (pendingFormType) {
      setSelectedFormType(pendingFormType);
      setPendingFormType(null);
    }
    
    setShowWarehouseModal(false);
  };

  const handleChangeWarehouse = () => {
    setShowWarehouseModal(true);
  };

  const handleSaveAndContinue = async (entryId?: string) => {
    try {
      const payload = {
        dno: editForm.dno,
        type: editForm.type,
        color: editForm.color,
        size: editForm.size,
        qty: Number(editForm.qty),
        date: editForm.date,
        formType: entryId ? editForm.formType || "dispatch" : selectedFormType,
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
        ...(editForm.channel && { channel: editForm.channel }),
      };
      
      if (entryId) {
        await api.patch(`/warehouse/domestic/${entryId}`, payload);
        setEditingEntry(null);
      } else {
        await api.post("/warehouse/domestic", payload);
      }
      
      // Reset form and prepare for next entry
      setEditForm({
        dno: "",
        type: "",
        color: "",
        size: "",
        qty: "",
        mrp: "",
        date: new Date().toISOString().split("T")[0],
        formType: selectedFormType,
        receiver: "",
        supplier: "",
        transferType: "",
        channel: "",
      });
      setIsCreating(true);
      fetchEntries();
      
      // Focus first field for next entry
      setTimeout(() => dnoRef.current?.focus(), 100);
    } catch (err: unknown) {
      console.error("Error saving entry:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to save entry: " + (axiosError || errorMsg));
    }
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEntries.map(entry => ({
      DNO: entry.dno,
      Type: entry.type,
      Color: entry.color,
      Size: entry.size,
      Quantity: entry.qty,
      Date: entry.date?.split("T")[0],
      FormType: entry.formType,
      Receiver: entry.receiver,
      Supplier: entry.supplier,
      TransferType: entry.transferType,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Domestic Transactions");
    XLSX.writeFile(workbook, `domestic_transactions_${selectedFormType}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleImportFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as any[];

        if (!rows.length) {
          alert("No rows found in the Excel sheet.");
          return;
        }

        const headers = (rows[0] as string[]).map((h) => String(h || "").trim());
        const headerMap = new Map<string, number>();
        headers.forEach((h, idx) => headerMap.set(h.toLowerCase(), idx));

        const headerIndex = (names: string[]) => {
          for (const name of names) {
            const idx = headerMap.get(name.toLowerCase());
            if (idx !== undefined) return idx;
          }
          return -1;
        };

        const sizeColumns = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];
        const sizeIndices = sizeColumns
          .map((size) => ({ size, index: headerIndex([size]) }))
          .filter((entry) => entry.index >= 0);

        const dnoIndex = headerIndex(["DNO", "D NO", "D.NO", "D.NO.", "DESIGN NO", "DESIGN NUMBER"]);
        const colorIndex = headerIndex(["COLOR", "COLOUR", "COL"]);
        const sizeIndex = headerIndex(["SIZE"]);
        const qtyIndex = headerIndex(["QTY", "QUANTITY"]);
        const dateIndex = headerIndex(["DATE"]);
        const typeIndex = headerIndex(["TYPE"]);
        const formTypeIndex = headerIndex(["FORMTYPE", "FORM TYPE"]);
        const receiverIndex = headerIndex(["RECEIVER"]);
        const supplierIndex = headerIndex(["SUPPLIER"]);
        const transferTypeIndex = headerIndex(["TRANSFERTYPE", "TRANSFER TYPE"]);

        const today = new Date().toISOString().split("T")[0];
        const payloads: Array<Record<string, unknown>> = [];

        for (let i = 1; i < rows.length; i += 1) {
          const row = rows[i] as any[];
          if (!row || row.length === 0) continue;

          const dno = dnoIndex >= 0 ? String(row[dnoIndex] || "").trim() : "";
          if (!dno) continue;

          const color = colorIndex >= 0 ? String(row[colorIndex] || "").trim() : "";
          const type = typeIndex >= 0 ? String(row[typeIndex] || "").trim() : "";
          const date = dateIndex >= 0 ? String(row[dateIndex] || "").trim() : "";
          const formType = formTypeIndex >= 0 ? String(row[formTypeIndex] || "").trim() : "";
          const receiver = receiverIndex >= 0 ? String(row[receiverIndex] || "").trim() : "";
          const supplier = supplierIndex >= 0 ? String(row[supplierIndex] || "").trim() : "";
          const transferType = transferTypeIndex >= 0 ? String(row[transferTypeIndex] || "").trim() : "";

          const basePayload = {
            dno,
            type,
            color,
            date: date || today,
            formType: formType || selectedFormType,
            ...(receiver ? { receiver } : {}),
            ...(supplier ? { supplier } : {}),
            ...(transferType ? { transferType } : {}),
          };

          if (sizeIndices.length > 0) {
            for (const { size, index } of sizeIndices) {
              const rawQty = row[index];
              const qty = Number(rawQty || 0);
              if (!Number.isFinite(qty) || qty <= 0) continue;

              payloads.push({
                ...basePayload,
                size,
                qty,
              });
            }
          } else {
            const sizeValue = sizeIndex >= 0 ? String(row[sizeIndex] || "").trim() : "";
            const qtyValue = qtyIndex >= 0 ? Number(row[qtyIndex] || 0) : 0;

            if (!sizeValue || !Number.isFinite(qtyValue) || qtyValue <= 0) continue;

            payloads.push({
              ...basePayload,
              size: sizeValue,
              qty: qtyValue,
            });
          }
        }

        if (payloads.length === 0) {
          alert("No rows were imported. Please verify the Excel columns and data.");
          return;
        }

        const chunkSize = 200;
        let inserted = 0;
        let rejected = 0;
        let failed = 0;

        for (let i = 0; i < payloads.length; i += chunkSize) {
          const chunk = payloads.slice(i, i + chunkSize);
          try {
            const response = await api.post("/warehouse/domestic/bulk", { entries: chunk });
            inserted += response.data?.inserted || 0;
            rejected += response.data?.rejected?.length || 0;
            failed += response.data?.errors?.length || 0;
          } catch (err) {
            console.error("Bulk import failed:", err);
            failed += chunk.length;
          }
        }

        if (inserted === 0) {
          alert("No rows were imported. Please verify the Excel columns and data.");
          return;
        }

        const failureNote = rejected + failed > 0 ? ` (${rejected + failed} failed)` : "";
        alert(`Successfully imported ${inserted} entries!${failureNote}`);
        fetchEntries();
      } catch (err) {
        console.error("Error importing Excel:", err);
        alert("Failed to import Excel file. Please check the file format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Warehouse Selection Modal */}
        {showWarehouseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-8 shadow-2xl max-w-4xl w-full">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Warehouse Type</h2>
                <p className="text-gray-600 text-lg">Choose the warehouse option that best fits your needs</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Online Warehouse Card */}
                <button
                  onClick={() => handleWarehouseSelect("online")}
                  className="group relative bg-white border-2 border-gray-200 hover:border-orange-400 rounded-lg p-6 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.612 15.039A8.978 8.978 0 0112 2c4.97 0 9.185 3.364 10.388 7.86M2.612 8.96A8.978 8.978 0 0112 22c4.97 0 9.185-3.364 10.388-7.86" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Online Warehouse</h3>
                    <p className="text-gray-600 text-sm mb-4">Manage your digital inventory and fulfill online orders</p>
                    
                    <ul className="text-left space-y-2 mb-6">
                      <li className="flex items-start text-sm text-gray-600">
                        <span className="text-orange-500 font-bold mr-2">•</span>
                        <span>Real-time inventory tracking</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <span className="text-orange-500 font-bold mr-2">•</span>
                        <span>Automated order processing</span>
                      </li>
                      <li className="flex items-start text-sm text-gray-600">
                        <span className="text-orange-500 font-bold mr-2">•</span>
                        <span>Digital fulfillment integration</span>
                      </li>
                    </ul>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <span className="inline-block text-orange-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                        Select Online Warehouse →
                      </span>
                    </div>
                  </div>
                </button>
              </div>

              {!pendingFormType && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      setShowWarehouseModal(false);
                    }}
                    className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {isFormTypeLocked && (
                <Link href="/domestic-homepage" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
                  ← Back to Homepage
                </Link>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Domestic Warehouse Dashboard</h1>
                <p className="text-gray-600">View and manage domestic warehouse transactions</p>
              </div>
            </div>
            <button
              onClick={handleCreate}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              + New Transaction
            </button>
          </div>

          {/* Excel Import/Export Buttons */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleExportToExcel}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <span>📊</span> Export to Excel
            </button>
            <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer">
              <span>📥</span> Import from Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFromExcel}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected Warehouse Display for Transfer Forms */}
          {(selectedFormType === "transfer inwards" || selectedFormType === "transfer outwards") && selectedWarehouse && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Selected Warehouse:</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">Online Warehouse</p>
                </div>
                <button
                  onClick={handleChangeWarehouse}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Change Warehouse
                </button>
              </div>
            </div>
          )}

          {/* Form Type Buttons - Always Visible */}
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Transaction Type {isFormTypeLocked && <span className="text-sm text-gray-500">(Locked)</span>}</h3>
            <div className="flex flex-wrap gap-3">
              {["dispatch", "production", "purchase", "transfer inwards", "transfer outwards", "return", "sample"].map((type) => (
                <button
                  key={type}
                  onClick={() => handleFormTypeClick(type)}
                  disabled={isFormTypeLocked && selectedFormType !== type}
                  className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${
                    selectedFormType === type
                      ? "bg-green-600 text-white shadow-lg"
                      : isFormTypeLocked && selectedFormType !== type
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {isFormTypeLocked && (
              <p className="text-sm text-gray-500 mt-3">Form type is locked. To change, visit the domestic homepage or access forms directly.</p>
            )}
          </div>

          {/* Form Type Buttons for Creating New Entry */}
          {isCreating && (
            <div className="mb-4 border-t pt-4 border-gray-300">
              <h3 className="text-lg font-semibold mb-3">Confirm Form Type</h3>
              <p className="text-sm text-gray-600 mb-3">Creating new entry for: <span className="font-semibold capitalize">{selectedFormType}</span></p>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <input
              type="text"
              placeholder="Search by DNO, Type, Color, or Form Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        ) : (selectedFormType === "transfer inwards" || selectedFormType === "transfer outwards") && !selectedWarehouse ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="inline-block mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📦</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Select a Warehouse</h3>
            <p className="text-gray-600 mb-6">Please select a warehouse to proceed with {selectedFormType === "transfer inwards" ? "Transfer Inwards" : "Transfer Outwards"}</p>
            <button
              onClick={() => setShowWarehouseModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Select Warehouse
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {selectedFormType === "sample" ? (
                // Sample Form - New Format with Size Columns
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                      {SAMPLE_SIZES.map(size => (
                        <th key={size} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{size}</th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isCreatingSample && (
                      <tr className="bg-green-50">
                        <td className="px-6 py-4">
                          <input 
                            ref={sampleDnoRef}
                            type="text" 
                            value={newSampleRow.dno} 
                            onChange={(e) => setNewSampleRow({...newSampleRow, dno: e.target.value})} 
                            onKeyDown={(e) => handleSampleKeyDown(e, 'dno')}
                            placeholder="Design Number" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            ref={sampleColorRef}
                            type="text" 
                            value={newSampleRow.color} 
                            onChange={(e) => setNewSampleRow({...newSampleRow, color: e.target.value})} 
                            onKeyDown={(e) => handleSampleKeyDown(e, 'color')}
                            placeholder="Color" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        {SAMPLE_SIZES.map(size => (
                          <td key={size} className="px-2 py-4">
                            <input 
                              ref={(el) => { if (el) sampleSizeRefs.current[size] = el; }}
                              type="number" 
                              value={newSampleRow.sizes[size] || ""} 
                              onChange={(e) => setNewSampleRow({
                                ...newSampleRow, 
                                sizes: {...newSampleRow.sizes, [size]: Number(e.target.value) || 0}
                              })} 
                              onKeyDown={(e) => handleSampleKeyDown(e, `size-${size}`)}
                              placeholder="" 
                              className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                            />
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <button onClick={handleSaveSampleRow} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                          <button onClick={handleCancelSample} className="text-gray-600 hover:text-gray-900">Cancel</button>
                        </td>
                      </tr>
                    )}
                    {filteredSampleRows.map((row, idx) => {
                      const rowKey = `${row.dno}_${row.color}`;
                      const isEditing = editingSampleRow === rowKey;
                      return (
                      <tr key={idx}>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editSampleForm.dno} 
                                onChange={(e) => setEditSampleForm({...editSampleForm, dno: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editSampleForm.color} 
                                onChange={(e) => setEditSampleForm({...editSampleForm, color: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4">
                                <input 
                                  type="number" 
                                  value={editSampleForm.sizes[size] || ""} 
                                  onChange={(e) => setEditSampleForm({
                                    ...editSampleForm, 
                                    sizes: {...editSampleForm.sizes, [size]: Number(e.target.value) || 0}
                                  })} 
                                  className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleUpdateSampleRow(row)} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                              <button onClick={() => setEditingSampleRow(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.color}</td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                {row.sizes[size] || "-"}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleEditSampleRow(row)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                              <button onClick={() => handleDeleteSampleRow(row)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : selectedFormType === "production" ? (
                // Production Form - New Format with Size Columns
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                      {SAMPLE_SIZES.map(size => (
                        <th key={size} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{size}</th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isCreatingProduction && (
                      <tr className="bg-green-50">
                        <td className="px-6 py-4">
                          <input 
                            ref={productionDnoRef}
                            type="text" 
                            value={newProductionRow.dno} 
                            onChange={(e) => setNewProductionRow({...newProductionRow, dno: e.target.value})} 
                            onKeyDown={(e) => handleProductionKeyDown(e, 'dno')}
                            placeholder="Design Number" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            ref={productionColorRef}
                            type="text" 
                            value={newProductionRow.color} 
                            onChange={(e) => setNewProductionRow({...newProductionRow, color: e.target.value})} 
                            onKeyDown={(e) => handleProductionKeyDown(e, 'color')}
                            placeholder="Color" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        {SAMPLE_SIZES.map(size => (
                          <td key={size} className="px-2 py-4">
                            <input 
                              ref={(el) => { if (el) productionSizeRefs.current[size] = el; }}
                              type="number" 
                              value={newProductionRow.sizes[size] || ""} 
                              onChange={(e) => setNewProductionRow({
                                ...newProductionRow, 
                                sizes: {...newProductionRow.sizes, [size]: Number(e.target.value) || 0}
                              })} 
                              onKeyDown={(e) => handleProductionKeyDown(e, `size-${size}`)}
                              placeholder="" 
                              className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                            />
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <button onClick={handleSaveProductionRow} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                          <button onClick={handleCancelProduction} className="text-gray-600 hover:text-gray-900">Cancel</button>
                        </td>
                      </tr>
                    )}
                    {filteredProductionRows.map((row, idx) => {
                      const rowKey = `${row.dno}_${row.color}`;
                      const isEditing = editingProductionRow === rowKey;
                      return (
                      <tr key={idx}>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editProductionForm.dno} 
                                onChange={(e) => setEditProductionForm({...editProductionForm, dno: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editProductionForm.color} 
                                onChange={(e) => setEditProductionForm({...editProductionForm, color: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4">
                                <input 
                                  type="number" 
                                  value={editProductionForm.sizes[size] || ""} 
                                  onChange={(e) => setEditProductionForm({
                                    ...editProductionForm, 
                                    sizes: {...editProductionForm.sizes, [size]: Number(e.target.value) || 0}
                                  })} 
                                  className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleUpdateProductionRow(row)} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                              <button onClick={() => setEditingProductionRow(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.color}</td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                {row.sizes[size] || "-"}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleEditProductionRow(row)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                              <button onClick={() => handleDeleteProductionRow(row)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : selectedFormType === "purchase" ? (
                // Purchase Form - New Format with Size Columns
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                      {SAMPLE_SIZES.map(size => (
                        <th key={size} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{size}</th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isCreatingPurchase && (
                      <tr className="bg-green-50">
                        <td className="px-6 py-4">
                          <input 
                            ref={purchaseDnoRef}
                            type="text" 
                            value={newPurchaseRow.dno} 
                            onChange={(e) => setNewPurchaseRow({...newPurchaseRow, dno: e.target.value})} 
                            onKeyDown={(e) => handlePurchaseKeyDown(e, 'dno')}
                            placeholder="Design Number" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            ref={purchaseColorRef}
                            type="text" 
                            value={newPurchaseRow.color} 
                            onChange={(e) => setNewPurchaseRow({...newPurchaseRow, color: e.target.value})} 
                            onKeyDown={(e) => handlePurchaseKeyDown(e, 'color')}
                            placeholder="Color" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        {SAMPLE_SIZES.map(size => (
                          <td key={size} className="px-2 py-4">
                            <input 
                              ref={(el) => { if (el) purchaseSizeRefs.current[size] = el; }}
                              type="number" 
                              value={newPurchaseRow.sizes[size] || ""} 
                              onChange={(e) => setNewPurchaseRow({
                                ...newPurchaseRow, 
                                sizes: {...newPurchaseRow.sizes, [size]: Number(e.target.value) || 0}
                              })} 
                              onKeyDown={(e) => handlePurchaseKeyDown(e, `size-${size}`)}
                              placeholder="" 
                              className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                            />
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <button onClick={handleSavePurchaseRow} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                          <button onClick={handleCancelPurchase} className="text-gray-600 hover:text-gray-900">Cancel</button>
                        </td>
                      </tr>
                    )}
                    {filteredPurchaseRows.map((row, idx) => {
                      const rowKey = `${row.dno}_${row.color}`;
                      const isEditing = editingPurchaseRow === rowKey;
                      return (
                      <tr key={idx}>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editPurchaseForm.dno} 
                                onChange={(e) => setEditPurchaseForm({...editPurchaseForm, dno: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editPurchaseForm.color} 
                                onChange={(e) => setEditPurchaseForm({...editPurchaseForm, color: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4">
                                <input 
                                  type="number" 
                                  value={editPurchaseForm.sizes[size] || ""} 
                                  onChange={(e) => setEditPurchaseForm({
                                    ...editPurchaseForm, 
                                    sizes: {...editPurchaseForm.sizes, [size]: Number(e.target.value) || 0}
                                  })} 
                                  className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleUpdatePurchaseRow(row)} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                              <button onClick={() => setEditingPurchaseRow(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.color}</td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                {row.sizes[size] || "-"}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleEditPurchaseRow(row)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                              <button onClick={() => handleDeletePurchaseRow(row)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : selectedFormType === "dispatch" ? (
                // Dispatch Form - New Format with Size Columns
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                      {SAMPLE_SIZES.map(size => (
                        <th key={size} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{size}</th>
                      ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isCreatingDispatch && (
                      <tr className="bg-green-50">
                        <td className="px-6 py-4">
                          <input 
                            ref={dispatchDnoRef}
                            type="text" 
                            value={newDispatchRow.dno} 
                            onChange={(e) => setNewDispatchRow({...newDispatchRow, dno: e.target.value})} 
                            onKeyDown={(e) => handleDispatchKeyDown(e, 'dno')}
                            placeholder="Design Number" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            ref={dispatchColorRef}
                            type="text" 
                            value={newDispatchRow.color} 
                            onChange={(e) => setNewDispatchRow({...newDispatchRow, color: e.target.value})} 
                            onKeyDown={(e) => handleDispatchKeyDown(e, 'color')}
                            placeholder="Color" 
                            className="w-full px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                        {SAMPLE_SIZES.map(size => (
                          <td key={size} className="px-2 py-4">
                            <input 
                              ref={(el) => { if (el) dispatchSizeRefs.current[size] = el; }}
                              type="number" 
                              value={newDispatchRow.sizes[size] || ""} 
                              onChange={(e) => setNewDispatchRow({
                                ...newDispatchRow, 
                                sizes: {...newDispatchRow.sizes, [size]: Number(e.target.value) || 0}
                              })} 
                              onKeyDown={(e) => handleDispatchKeyDown(e, `size-${size}`)}
                              placeholder="" 
                              className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                            />
                          </td>
                        ))}
                        <td className="px-6 py-4">
                          <button onClick={handleSaveDispatchRow} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                          <button onClick={handleCancelDispatch} className="text-gray-600 hover:text-gray-900">Cancel</button>
                        </td>
                      </tr>
                    )}
                    {filteredDispatchRows.map((row, idx) => {
                      const rowKey = `${row.dno}_${row.color}`;
                      const isEditing = editingDispatchRow === rowKey;
                      return (
                      <tr key={idx}>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editDispatchForm.dno} 
                                onChange={(e) => setEditDispatchForm({...editDispatchForm, dno: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editDispatchForm.color} 
                                onChange={(e) => setEditDispatchForm({...editDispatchForm, color: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4">
                                <input 
                                  type="number" 
                                  value={editDispatchForm.sizes[size] || ""} 
                                  onChange={(e) => setEditDispatchForm({
                                    ...editDispatchForm, 
                                    sizes: {...editDispatchForm.sizes, [size]: Number(e.target.value) || 0}
                                  })} 
                                  className="w-16 px-2 py-1 border rounded text-black bg-white text-center" 
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleUpdateDispatchRow(row)} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                              <button onClick={() => setEditingDispatchRow(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.color}</td>
                            {SAMPLE_SIZES.map(size => (
                              <td key={size} className="px-2 py-4 text-center whitespace-nowrap text-sm text-gray-900">
                                {row.sizes[size] || "-"}
                              </td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleEditDispatchRow(row)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                              <button onClick={() => handleDeleteDispatchRow(row)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                // Regular Form - Original Format for transfer and return
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    {(selectedFormType === "transfer inwards" || selectedFormType === "transfer outwards") && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                    )}
                    {selectedFormType === "return" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isCreating && (
                    <tr className="bg-green-50">
                      <td className="px-6 py-4"><input ref={dnoRef} type="text" value={editForm.dno} onChange={(e) => setEditForm({...editForm, dno: e.target.value})} onKeyDown={(e) => handleKeyDown(e, typeRef)} placeholder="DNO" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={typeRef} type="text" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} onKeyDown={(e) => handleKeyDown(e, colorRef)} placeholder="Type" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={colorRef} type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} onKeyDown={(e) => handleKeyDown(e, sizeRef)} placeholder="Color" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={sizeRef} type="text" value={editForm.size} onChange={(e) => setEditForm({...editForm, size: e.target.value})} onKeyDown={(e) => handleKeyDown(e, qtyRef)} placeholder="Size" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={qtyRef} type="number" value={editForm.qty} onChange={(e) => setEditForm({...editForm, qty: e.target.value})} onKeyDown={(e) => handleKeyDown(e, dateRef)} placeholder="Qty" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={dateRef} type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} onKeyDown={(e) => {
                        if (selectedFormType === "transfer inwards" || selectedFormType === "transfer outwards" || selectedFormType === "return") {
                          handleKeyDown(e, additionalFieldRef);
                        } else {
                          handleKeyDown(e, undefined, true);
                        }
                      }} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      {(selectedFormType === "transfer inwards" || selectedFormType === "transfer outwards") && (
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input
                              ref={additionalFieldRef}
                              type="text"
                              value={editForm.channel}
                              readOnly
                              placeholder="Warehouse"
                              className="w-full px-2 py-1 border rounded text-black bg-gray-100 cursor-not-allowed"
                            />
                          </div>
                        </td>
                      )}
                      {selectedFormType === "return" && (
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input
                              ref={additionalFieldRef}
                              type="text"
                              value={editForm.channel}
                              onChange={(e) => handleChannelInputChange(e.target.value)}
                              onFocus={() => setShowChannelDropdown(true)}
                              onBlur={() => setTimeout(() => setShowChannelDropdown(false), 200)}
                              onKeyDown={(e) => handleKeyDown(e, undefined, true)}
                              placeholder="Channel"
                              className="w-full px-2 py-1 border rounded text-black bg-white"
                            />
                            {showChannelDropdown && filteredChannelOptions.filter(opt => opt.includes("return")).length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                {filteredChannelOptions.filter(opt => opt.includes("return")).map((option, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setEditForm({...editForm, channel: option});
                                      setShowChannelDropdown(false);
                                    }}
                                    className="px-3 py-2 hover:bg-green-50 cursor-pointer text-black"
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <button onClick={handleSaveNew} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </tr>
                  )}
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id}>
                      {editingEntry === entry._id ? (
                        <>
                          <td className="px-6 py-4"><input ref={dnoRef} type="text" value={editForm.dno} onChange={(e) => setEditForm({...editForm, dno: e.target.value})} onKeyDown={(e) => handleKeyDown(e, typeRef)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-6 py-4"><input ref={typeRef} type="text" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} onKeyDown={(e) => handleKeyDown(e, colorRef)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-6 py-4"><input ref={colorRef} type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} onKeyDown={(e) => handleKeyDown(e, sizeRef)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-6 py-4"><input ref={sizeRef} type="text" value={editForm.size} onChange={(e) => setEditForm({...editForm, size: e.target.value})} onKeyDown={(e) => handleKeyDown(e, qtyRef)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-6 py-4"><input ref={qtyRef} type="number" value={editForm.qty} onChange={(e) => setEditForm({...editForm, qty: e.target.value})} onKeyDown={(e) => handleKeyDown(e, dateRef)} className="w-full px-2 py-1 border rounded" /></td>
                          <td className="px-6 py-4"><input ref={dateRef} type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} onKeyDown={(e) => {
                            const formType = editForm.formType || "";
                            if (formType === "transfer inwards" || formType === "transfer outwards" || formType === "return") {
                              handleKeyDown(e, additionalFieldRef);
                            } else {
                              handleKeyDown(e, undefined, true, entry._id);
                            }
                          }} className="w-full px-2 py-1 border rounded" /></td>
                          {(editForm.formType === "transfer inwards" || editForm.formType === "transfer outwards") && (
                            <td className="px-6 py-4">
                              <input 
                                ref={additionalFieldRef}
                                type="text" 
                                value={editForm.channel} 
                                readOnly
                                placeholder="Warehouse" 
                                className="w-full px-2 py-1 border rounded bg-gray-100 cursor-not-allowed"
                              />
                            </td>
                          )}
                          {editForm.formType === "return" && (
                            <td className="px-6 py-4">
                              <div className="relative">
                                <input
                                  ref={additionalFieldRef}
                                  type="text"
                                  value={editForm.channel}
                                  onChange={(e) => handleChannelInputChange(e.target.value)}
                                  onFocus={() => setShowChannelDropdown(true)}
                                  onBlur={() => setTimeout(() => setShowChannelDropdown(false), 200)}
                                  onKeyDown={(e) => handleKeyDown(e, undefined, true, entry._id)}
                                  placeholder="Channel"
                                  className="w-full px-2 py-1 border rounded"
                                />
                                {showChannelDropdown && filteredChannelOptions.filter(opt => opt.includes("return")).length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                    {filteredChannelOptions.filter(opt => opt.includes("return")).map((option, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setEditForm({...editForm, channel: option});
                                          setShowChannelDropdown(false);
                                        }}
                                        className="px-3 py-2 hover:bg-green-50 cursor-pointer"
                                      >
                                        {option}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <button onClick={() => handleUpdate(entry._id)} className="text-green-600 hover:text-green-900 mr-3">Save</button>
                            <button onClick={() => setEditingEntry(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.dno}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.color}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.size}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date?.split("T")[0]}</td>
                          {(entry.formType === "transfer inwards" || entry.formType === "transfer outwards") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.channel}</td>
                          )}
                          {entry.formType === "return" && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.channel}</td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleEdit(entry)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button onClick={() => handleDelete(entry._id)} className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
              {selectedFormType === "sample" && sampleRows.length === 0 && !isCreatingSample && (
                <div className="text-center py-12 text-gray-500">
                  No sample transactions found. Click "+ New Transaction" to create your first sample entry.
                </div>
              )}
              {selectedFormType === "production" && productionRows.length === 0 && !isCreatingProduction && (
                <div className="text-center py-12 text-gray-500">
                  No production transactions found. Click "+ New Transaction" to create your first production entry.
                </div>
              )}
              {selectedFormType === "purchase" && purchaseRows.length === 0 && !isCreatingPurchase && (
                <div className="text-center py-12 text-gray-500">
                  No purchase transactions found. Click "+ New Transaction" to create your first purchase entry.
                </div>
              )}
              {selectedFormType === "dispatch" && dispatchRows.length === 0 && !isCreatingDispatch && (
                <div className="text-center py-12 text-gray-500">
                  No dispatch transactions found. Click "+ New Transaction" to create your first dispatch entry.
                </div>
              )}
              {selectedFormType !== "sample" && selectedFormType !== "production" && selectedFormType !== "purchase" && selectedFormType !== "dispatch" && filteredEntries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No transactions found. <Link href="/domestic/form" className="text-green-600 hover:underline">Create your first transaction</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DomesticPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>}>
      <DomesticDashboard />
    </Suspense>
  );
}
