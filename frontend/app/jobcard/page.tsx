"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import Image from "next/image";

type CuttingEntry = {
  id: string;
  color: string;
  quantity: string;
};

type JobCardForm = {
  designNumber: string;
  brand: string;
  fabric: string;
  fabricComposition: string;
  gsm: string;
  mrp: string;
  imageFile?: File | null;
  imagePreview?: string;
  cutting?: CuttingEntry[];
};

type SavedJobCard = {
  _id: string;
  designNumber: string;
  brand: string;
  fabric: string;
  fabricComposition: string;
  gsm: number;
  mrp: number;
  image?: string;
  cutting?: { color: string; quantity: number }[];
  createdAt: string;
};

export default function JobCardPage() {
  const [formData, setFormData] = useState<JobCardForm>({
    designNumber: "",
    brand: "",
    fabric: "",
    fabricComposition: "",
    gsm: "",
    mrp: "",
    imageFile: null,
    cutting: [],
  });

  const [savedJobCards, setSavedJobCards] = useState<SavedJobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SavedJobCard | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchJobCards();
  }, []);

  // Handle Enter key to move to next input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = formRef.current;
      if (!form) return;

      const inputs = Array.from(form.querySelectorAll<HTMLInputElement>(
        'input[type="text"], input[type="number"]'
      )).filter(input => !input.disabled && input.type !== 'file');

      const currentIndex = inputs.indexOf(e.currentTarget);
      if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      }
    }
  };

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const response = await api.get("/jobcard");
      setSavedJobCards(response.data);
    } catch (err) {
      console.error("Error fetching job cards:", err);
    } finally {
      setLoading(false);
    }
  };

  const addVariantRow = () => {
    // Removed - variants no longer used
  };

  const deleteVariantRow = (id: string) => {
    // Removed - variants no longer used
  };

  const updateVariantRow = (
    id: string,
    field: string,undefinevalue: string
  ) => {
    // Removed - variants no longer used
  };

  // Cutting management functions
  const addCuttingEntry = () => {
    const newEntry: CuttingEntry = {
      id: Date.now().toString(),
      color: "",
      quantity: "",
    };
    setFormData({
      ...formData,
      cutting: [...(formData.cutting || []), newEntry],
    });
  };

  const deleteCuttingEntry = (id: string) => {
    setFormData({
      ...formData,
      cutting: (formData.cutting || []).filter((entry) => entry.id !== id),
    });
  };

  const updateCuttingEntry = (id: string, field: keyof Omit<CuttingEntry, 'id'>, value: string) => {
    setFormData({
      ...formData,
      cutting: (formData.cutting || []).map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    });
  };

  const updateMainField = (field: keyof JobCardForm, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate main fields
      if (
        !formData.designNumber ||
        !formData.brand ||
        !formData.fabric ||
        !formData.fabricComposition ||
        !formData.gsm ||
        !formData.mrp
      ) {
        alert("Please fill all main product fields");
        return;
      }

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('designNumber', formData.designNumber);
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('fabric', formData.fabric);
      formDataToSend.append('fabricComposition', formData.fabricComposition);
      formDataToSend.append('gsm', formData.gsm);
      formDataToSend.append('mrp', formData.mrp);
      
      // Add cutting data if present
      if (formData.cutting && formData.cutting.length > 0) {
        const cuttingData = formData.cutting
          .filter(entry => entry.color && entry.quantity)
          .map(entry => ({
            color: entry.color,
            quantity: parseInt(entry.quantity) || 0,
          }));
        formDataToSend.append('cutting', JSON.stringify(cuttingData));
      }
      
      if (formData.imageFile) {
        formDataToSend.append('image', formData.imageFile);
      }

      await api.post("/jobcard", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

        cutting: [],
      alert("Job card saved successfully!");

      // Reset form
      setFormData({
        designNumber: "",
        brand: "",
        fabric: "",
        fabricComposition: "",
        gsm: "",
        mrp: "",
        imageFile: null,
      });

      fetchJobCards();
    } catch (err: any) {
      console.error("Error saving job card:", err);
      alert(
        "Failed to save job card: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (jobCard: SavedJobCard) => {
    setEditingId(jobCard._id);
    setEditForm(jobCard);
  };

  const handleUpdate = async () => {
    if (!editForm || !editingId) return;

    try {
      await api.patch(`/jobcard/${editingId}`, editForm);
      setEditingId(null);
      setEditForm(null);
      fetchJobCards();
    } catch (err: any) {
      console.error("Error updating job card:", err);
      alert("Failed to update: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this job card?")) {
      try {
        await api.delete(`/jobcard/${id}`);
        fetchJobCards();
      } catch (err) {
        console.error("Error deleting job card:", err);
        alert("Failed to delete job card");
      }
    }
  };

  const filteredJobCards = savedJobCards
    .filter(
      (card) =>
        card.designNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.fabric.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0,30);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Job Card Entry</h1>
              <p className="mt-1 text-indigo-100">
                Add product details with images and variants
              </p>
              <p className="mt-2 text-sm text-indigo-200 bg-indigo-500 bg-opacity-30 px-3 py-2 rounded inline-block">
                💡 These JobCard entries will be reflected in <strong>Domestic Inventory</strong> with aggregated warehouse stock
              </p>
            </div>
            <Link
              href="/forms"
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors font-semibold"
            >
              ← Back to Forms
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Entry Form Section */}
        <div ref={formRef} className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Design Info</h2>

          {/* Main Product Details */}
          <div className="space-y-8">
            {/* 1. Upload Pictures */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Upload Pictures</h3>
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8">
                {formData.imagePreview ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-48 h-48">
                      <Image
                        src={formData.imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded border-2 border-gray-300"
                      />
                    </div>
                    <label className="inline-block">
                      <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold cursor-pointer">
                        Change Image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <p className="text-gray-600 font-medium">No images uploaded</p>
                    <label className="inline-block">
                      <span className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold cursor-pointer">
                        Choose files
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2. Design Number */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  2. Design Number
                </label>
                <input
                  type="text"
                  value={formData.designNumber}
                  onChange={(e) =>
                    updateMainField("designNumber", e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="Enter design number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* 3. Fabric */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  3. Fabric
                </label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => updateMainField("fabric", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter fabric type"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* 4. Fabric Composition */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  4. Fabric Composition
                </label>
                <input
                  type="text"
                  value={formData.fabricComposition}
                  onChange={(e) =>
                    updateMainField("fabricComposition", e.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., 100% Cotton"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* 5. Brand */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  5. Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => updateMainField("brand", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter brand"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* 6. GSM */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  6. GSM
                </label>
                <input
                  type="number"
                  value={formData.gsm}
                  onChange={(e) => updateMainField("gsm", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter GSM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* 7. MRP */}
              <div>
                <label className="block text-base font-semibold text-gray-900 mb-2">
                  7. MRP
                </label>
                <input
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => updateMainField("mrp", e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter MRP"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>
            </div>

            {/* 8. Cutting Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">8. Cutting Details (Optional)</h3>
                <button
                  type="button"
                  onClick={addCuttingEntry}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Cutting Entry
                </button>
              </div>

              {!formData.cutting || formData.cutting.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-600">No cutting entries added yet. Click "Add Cutting Entry" to add color-wise cutting quantities.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.cutting.map((entry, index) => (
                    <div key={entry.id} className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Color
                            </label>
                            <input
                              type="text"
                              value={entry.color}
                              onChange={(e) => updateCuttingEntry(entry.id, 'color', e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="e.g., Red, Blue, Green"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cutting Quantity
                            </label>
                            <input
                              type="number"
                              value={entry.quantity}
                              onChange={(e) => updateCuttingEntry(entry.id, 'quantity', e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="Enter quantity"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteCuttingEntry(entry.id)}
                          className="flex-shrink-0 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete entry"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={() => {
                setFormData({
                  designNumber: "",
                  brand: "",
                  fabric: "",
                  fabricComposition: "",
                  gsm: "",
                  mrp: "",
                  imageFile: null,
                  cutting: [],
                });
              }}
              className="px-8 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-semibold"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Submit Design Info"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
