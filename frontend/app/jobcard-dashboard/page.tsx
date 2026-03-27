"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "../../lib/api";
import { Search, Edit2, X, Plus, Trash2 } from "lucide-react";

type CuttingEntry = {
  color: string;
  quantity: number;
};

type JobCard = {
  _id: string;
  designNumber: string;
  brand: string;
  fabric: string;
  fabricComposition: string;
  gsm: number;
  mrp: number;
  image?: string;
  cutting?: CuttingEntry[];
  createdAt: string;
};

type EditFormData = {
  designNumber: string;
  brand: string;
  fabric: string;
  fabricComposition: string;
  gsm: string;
  mrp: string;
  cutting: CuttingEntry[];
};

const isEmptyField = (value?: string) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized === "unknown" || normalized === "n/a";
};

export default function JobCardDashboard() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [filteredJobCards, setFilteredJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCard, setEditingCard] = useState<JobCard | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchJobCards();
  }, []);

  useEffect(() => {
    filterJobCards();
  }, [jobCards, searchTerm]);

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const response = await api.get("/jobcard", {
        timeout: 20000,
      });

      const cards = Array.isArray(response.data) ? response.data : [];
      setJobCards(cards);
    } catch (err) {
      console.error("Error fetching job cards:", err);
      setJobCards([]);
    } finally {
      setLoading(false);
    }
  };

  const filterJobCards = () => {
    let filtered = [...jobCards];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.designNumber.toLowerCase().includes(term) ||
          card.brand.toLowerCase().includes(term) ||
          card.fabric.toLowerCase().includes(term) ||
          card.fabricComposition.toLowerCase().includes(term)
      );
    }

    setFilteredJobCards(filtered);
  };

  const handleEdit = (card: JobCard) => {
    setEditingCard(card);
    setEditFormData({
      designNumber: card.designNumber,
      brand: card.brand,
      fabric: card.fabric,
      fabricComposition: card.fabricComposition,
      gsm: card.gsm.toString(),
      mrp: card.mrp.toString(),
      cutting: card.cutting || [],
    });
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditFormData(null);
  };

  const handleUpdateField = (field: keyof EditFormData, value: string) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  const handleAddCuttingEntry = () => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        cutting: [...editFormData.cutting, { color: "", quantity: 0 }],
      });
    }
  };

  const handleDeleteCuttingEntry = (index: number) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        cutting: editFormData.cutting.filter((_, i) => i !== index),
      });
    }
  };

  const handleUpdateCuttingEntry = (index: number, field: keyof CuttingEntry, value: string) => {
    if (editFormData) {
      const updatedCutting = [...editFormData.cutting];
      updatedCutting[index] = {
        ...updatedCutting[index],
        [field]: field === 'quantity' ? parseInt(value) || 0 : value,
      };
      setEditFormData({
        ...editFormData,
        cutting: updatedCutting,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCard || !editFormData) return;

    try {
      setSaving(true);

      const updateData = {
        designNumber: editFormData.designNumber,
        brand: editFormData.brand,
        fabric: editFormData.fabric,
        fabricComposition: editFormData.fabricComposition,
        gsm: parseInt(editFormData.gsm) || 0,
        mrp: parseInt(editFormData.mrp) || 0,
        cutting: editFormData.cutting.filter(entry => entry.color && entry.quantity > 0),
      };

      await api.patch(`/jobcard/${editingCard._id}`, updateData);
      
      alert("Job card updated successfully!");
      handleCancelEdit();
      fetchJobCards();
    } catch (err: any) {
      console.error("Error updating job card:", err);
      alert("Failed to update job card: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (card: JobCard) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete job card ${card.designNumber}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/jobcard/${card._id}`);
      alert("Job card deleted successfully!");
      fetchJobCards();
    } catch (err: any) {
      console.error("Error deleting job card:", err);
      alert("Failed to delete job card: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Cards Dashboard</h1>
          <p className="text-lg text-gray-600">Browse all job card entries</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by design number, brand, fabric, or composition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-gray-600 mb-6">
            Showing {filteredJobCards.length} of {jobCards.length} job cards
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading job cards...</p>
            </div>
          </div>
        ) : filteredJobCards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No job cards found</h3>
            <p className="text-gray-600">
              {jobCards.length === 0
                ? "No job cards have been created yet"
                : "Try adjusting your search term"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredJobCards.map((card) => (
              <JobCardItem key={card._id} card={card} onEdit={handleEdit} onDelete={handleDeleteCard} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingCard && editFormData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Edit Job Card</h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Main Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Design Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.designNumber}
                    onChange={(e) => handleUpdateField('designNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) => handleUpdateField('brand', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fabric
                  </label>
                  <input
                    type="text"
                    value={editFormData.fabric}
                    onChange={(e) => handleUpdateField('fabric', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fabric Composition
                  </label>
                  <input
                    type="text"
                    value={editFormData.fabricComposition}
                    onChange={(e) => handleUpdateField('fabricComposition', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GSM
                  </label>
                  <input
                    type="number"
                    value={editFormData.gsm}
                    onChange={(e) => handleUpdateField('gsm', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MRP
                  </label>
                  <input
                    type="number"
                    value={editFormData.mrp}
                    onChange={(e) => handleUpdateField('mrp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Cutting Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Cutting Details</h3>
                  <button
                    type="button"
                    onClick={handleAddCuttingEntry}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>

                {editFormData.cutting.length === 0 ? (
                  <p className="text-gray-500 text-sm">No cutting entries</p>
                ) : (
                  <div className="space-y-3">
                    {editFormData.cutting.map((entry, index) => (
                      <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-semibold text-gray-600 w-6">{index + 1}.</span>
                        <input
                          type="text"
                          value={entry.color}
                          onChange={(e) => handleUpdateCuttingEntry(index, 'color', e.target.value)}
                          placeholder="Color"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                        <input
                          type="number"
                          value={entry.quantity}
                          onChange={(e) => handleUpdateCuttingEntry(index, 'quantity', e.target.value)}
                          placeholder="Quantity"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteCuttingEntry(index)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type JobCardItemProps = {
  card: JobCard;
  onEdit: (card: JobCard) => void;
  onDelete: (card: JobCard) => void;
};

function JobCardItem({ card, onEdit, onDelete }: JobCardItemProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      <div className="md:flex md:gap-10 p-6">
        {/* Left Column: Product Image */}
        <div className="md:w-1/3 w-full">
          {/* Product Image */}
          <div className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden">
            {card.image ? (
              <Image
                src={card.image}
                alt={card.designNumber}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="md:w-2/3 w-full mt-6 md:mt-0">
          <div className="space-y-6">
            {/* Design Number - Header with Edit Button */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {card.designNumber.toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(card.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(card)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(card)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailBlock
                label="Brand"
                value={isEmptyField(card.brand) ? "-" : card.brand}
              />
              <DetailBlock
                label="Fabric"
                value={isEmptyField(card.fabric) ? "-" : card.fabric}
              />
              <DetailBlock
                label="GSM"
                value={card.gsm && card.gsm > 0 ? card.gsm : "-"}
              />
              <DetailBlock
                label="Composition"
                value={isEmptyField(card.fabricComposition) ? "-" : card.fabricComposition}
              />
              <DetailBlock
                label="MRP"
                value={card.mrp && card.mrp > 0 ? `₹${card.mrp}` : "-"}
              />
              <DetailBlock
                label="Job Card ID"
                value={card._id.slice(-6).toUpperCase()}
              />

            {/* Cutting Details Section */}
            {card.cutting && card.cutting.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Cutting Details</h3>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Color
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {card.cutting.map((entry, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.color}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {entry.quantity}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td colSpan={2} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Total Cutting
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {card.cutting.reduce((sum, entry) => sum + entry.quantity, 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold text-gray-900 break-words">
        {value}
      </p>
    </div>
  );
}
