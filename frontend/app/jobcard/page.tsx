"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import Image from "next/image";

type VariantRow = {
  id: string;
  color: string;
  size: string;
  quantity: string;
  location: string;
  type: string;
};

type JobCardForm = {
  designNumber: string;
  brand: string;
  fabric: string;
  fabricComposition: string;
  mrp: string;
  image: string;
  imagePreview?: string;
  variants: VariantRow[];
};

type SavedJobCard = {
  _id: string;
  designNumber: string;
  brand: string;
  fabric: string;
  fabricComposition: string;
  mrp: number;
  image?: string;
  variants?: VariantRow[];
  createdAt: string;
};

export default function JobCardPage() {
  const [formData, setFormData] = useState<JobCardForm>({
    designNumber: "",
    brand: "",
    fabric: "",
    fabricComposition: "",
    mrp: "",
    image: "",
    variants: [
      {
        id: Date.now().toString(),
        color: "",
        size: "",
        quantity: "",
        location: "",
        type: "",
      },
    ],
  });

  const [savedJobCards, setSavedJobCards] = useState<SavedJobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<SavedJobCard | null>(null);

  useEffect(() => {
    fetchJobCards();
  }, []);

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
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          id: Date.now().toString(),
          color: "",
          size: "",
          quantity: "",
          location: "",
          type: "",
        },
      ],
    });
  };

  const deleteVariantRow = (id: string) => {
    if (formData.variants.length > 1) {
      setFormData({
        ...formData,
        variants: formData.variants.filter((v) => v.id !== id),
      });
    }
  };

  const updateVariantRow = (
    id: string,
    field: keyof VariantRow,
    value: string
  ) => {
    setFormData({
      ...formData,
      variants: formData.variants.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
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
      const base64String = reader.result as string;
      setFormData({
        ...formData,
        image: base64String,
        imagePreview: base64String,
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
        !formData.mrp
      ) {
        alert("Please fill all main product fields");
        return;
      }

      // Validate variant rows
      for (const variant of formData.variants) {
        if (
          !variant.color ||
          !variant.size ||
          !variant.quantity ||
          !variant.location ||
          !variant.type
        ) {
          alert("Please fill all fields in all variant rows");
          return;
        }
      }

      const payload = {
        designNumber: formData.designNumber,
        brand: formData.brand,
        fabric: formData.fabric,
        fabricComposition: formData.fabricComposition,
        mrp: Number(formData.mrp),
        image: formData.image,
        variants: formData.variants,
      };

      await api.post("/jobcard", payload);

      alert("Job card saved successfully!");

      // Reset form
      setFormData({
        designNumber: "",
        brand: "",
        fabric: "",
        fabricComposition: "",
        mrp: "",
        image: "",
        variants: [
          {
            id: Date.now().toString(),
            color: "",
            size: "",
            quantity: "",
            location: "",
            type: "",
          },
        ],
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

  const filteredJobCards = savedJobCards.filter(
    (card) =>
      card.designNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.fabric.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Entry Form Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Add New Job Card
          </h2>

          {/* Main Product Details */}
          <div className="border-2 border-indigo-200 rounded-lg p-6 mb-6 bg-indigo-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Main Product Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Image Upload */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Image
                </label>
                <div className="flex flex-col items-center gap-3">
                  {formData.imagePreview ? (
                    <div className="relative w-32 h-32">
                      <Image
                        src={formData.imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover rounded border-2 border-gray-300"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Design Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Design Number *
                </label>
                <input
                  type="text"
                  value={formData.designNumber}
                  onChange={(e) =>
                    updateMainField("designNumber", e.target.value)
                  }
                  placeholder="e.g., DN-001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => updateMainField("brand", e.target.value)}
                  placeholder="e.g., Nike"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* Fabric */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fabric *
                </label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => updateMainField("fabric", e.target.value)}
                  placeholder="e.g., Cotton"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* Fabric Composition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fabric Composition *
                </label>
                <input
                  type="text"
                  value={formData.fabricComposition}
                  onChange={(e) =>
                    updateMainField("fabricComposition", e.target.value)
                  }
                  placeholder="e.g., 100% Cotton"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* MRP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  MRP *
                </label>
                <input
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => updateMainField("mrp", e.target.value)}
                  placeholder="e.g., 1500"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Product Variants
              </h3>
              <button
                onClick={addVariantRow}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                + Add Variant
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Color *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Size *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Location *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type *
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.variants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) =>
                            updateVariantRow(variant.id, "color", e.target.value)
                          }
                          placeholder="Color"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) =>
                            updateVariantRow(variant.id, "size", e.target.value)
                          }
                          placeholder="Size"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={variant.quantity}
                          onChange={(e) =>
                            updateVariantRow(
                              variant.id,
                              "quantity",
                              e.target.value
                            )
                          }
                          placeholder="Qty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.location}
                          onChange={(e) =>
                            updateVariantRow(
                              variant.id,
                              "location",
                              e.target.value
                            )
                          }
                          placeholder="Location"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={variant.type}
                          onChange={(e) =>
                            updateVariantRow(variant.id, "type", e.target.value)
                          }
                          placeholder="Type"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteVariantRow(variant.id)}
                          disabled={formData.variants.length === 1}
                          className="text-red-600 hover:text-red-900 disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {saving ? "Saving..." : "Save Job Card"}
            </button>
          </div>
        </div>

        {/* Saved Job Cards Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Saved Job Cards
            </h2>
            <input
              type="text"
              placeholder="Search by design number, brand, or fabric..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-800"
            />
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600">Loading job cards...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Design Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Brand
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fabric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Composition
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MRP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobCards.map((card) => (
                    <tr key={card._id} className="hover:bg-gray-50">
                      {editingId === card._id ? (
                        <>
                          <td className="px-6 py-4">
                            {editForm?.image ? (
                              <div className="relative w-16 h-16">
                                <Image
                                  src={editForm.image}
                                  alt="Product"
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm?.designNumber || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  designNumber: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border rounded text-gray-800"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm?.brand || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  brand: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border rounded text-gray-800"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm?.fabric || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  fabric: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border rounded text-gray-800"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={editForm?.fabricComposition || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  fabricComposition: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border rounded text-gray-800"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={editForm?.mrp || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm!,
                                  mrp: Number(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 border rounded text-gray-800"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {card.variants?.length || 0} variant(s)
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={handleUpdate}
                              className="text-green-600 hover:text-green-900 mr-3 font-semibold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null);
                                setEditForm(null);
                              }}
                              className="text-gray-600 hover:text-gray-900 font-semibold"
                            >
                              Cancel
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            {card.image ? (
                              <div className="relative w-16 h-16">
                                <Image
                                  src={card.image}
                                  alt="Product"
                                  fill
                                  className="object-cover rounded"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  No image
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {card.designNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {card.brand}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {card.fabric}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {card.fabricComposition}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ₹{card.mrp}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {card.variants && card.variants.length > 0 ? (
                              <details className="cursor-pointer">
                                <summary className="font-semibold text-indigo-600">
                                  {card.variants.length} variant(s)
                                </summary>
                                <div className="mt-2 space-y-1 text-xs">
                                  {card.variants.map((v: any, idx: number) => (
                                    <div key={idx} className="bg-gray-50 p-2 rounded">
                                      {v.color} | {v.size} | Qty: {v.quantity} | {v.location} | {v.type}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ) : (
                              <span className="text-gray-400">No variants</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => handleEdit(card)}
                              className="text-blue-600 hover:text-blue-900 mr-3 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(card._id)}
                              className="text-red-600 hover:text-red-900 font-semibold"
                            >
                              Delete
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredJobCards.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No job cards found. Add some entries above to get started!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
