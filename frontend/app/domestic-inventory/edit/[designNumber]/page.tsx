"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";

type JobCard = {
  _id: string;
  designNumber: string;
  brand?: string;
  fabric?: string;
  fabricComposition?: string;
  gsm?: number;
  mrp?: number;
  image?: string;
};

type InventoryItem = {
  dno: string;
  color: string;
  size: string;
  inbound: number;
  outbound: number;
  stock: number;
};

export default function EditDomesticInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const designNumber = decodeURIComponent((params.designNumber as string) || "").trim();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    brand: "",
    fabric: "",
    fabricComposition: "",
    gsm: "",
    mrp: "",
    image: "",
  });

  useEffect(() => {
    fetchData();
  }, [designNumber]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const jobCardResponse = await api.get(`/jobcard/search`, {
        params: { query: designNumber },
      });

      const jobCards = jobCardResponse.data;
      const normalizedDesignNumber = designNumber.toLowerCase();
      const existingJobCard = jobCards.find(
        (jc: JobCard) =>
          (jc.designNumber || "").trim().toLowerCase() === normalizedDesignNumber
      );

      if (existingJobCard) {
        setJobCard(existingJobCard);
        setFormData({
          brand: existingJobCard.brand || "",
          fabric: existingJobCard.fabric || "",
          fabricComposition: existingJobCard.fabricComposition || "",
          gsm: existingJobCard.gsm ? String(existingJobCard.gsm) : "",
          mrp: existingJobCard.mrp ? String(existingJobCard.mrp) : "",
          image: existingJobCard.image || "",
        });
        if (existingJobCard.image) {
          setImagePreview(existingJobCard.image);
        }
      } else {
        setJobCard(null);
        setFormData({
          brand: "",
          fabric: "",
          fabricComposition: "",
          gsm: "",
          mrp: "",
          image: "",
        });
      }

      const inventoryResponse = await api.get("/inventory/warehouse/domestic", {
        timeout: 120000, // 2 minutes for inventory recalculation
      });
      const allInventory = inventoryResponse.data.inventory || [];
      const filteredInventory = allInventory.filter((item: InventoryItem) => item.dno === designNumber);
      setInventory(filteredInventory);
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData((prev) => ({ ...prev, image: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);

      const payload = {
        designNumber,
        brand: (formData.brand || "").trim() || "Unknown",
        fabric: (formData.fabric || "").trim() || "Unknown",
        fabricComposition: (formData.fabricComposition || "").trim() || "Unknown",
        gsm: (formData.gsm || "").trim() ? Number(formData.gsm) : 0,
        mrp: (formData.mrp || "").trim() ? Number(formData.mrp) : 0,
        image: formData.image || undefined,
      };

      if (jobCard) {
        await api.patch(`/jobcard/${jobCard._id}`, payload);
        alert("Product details updated successfully!");
      } else {
        await api.post("/jobcard", payload);
        alert("Product details created successfully!");
      }

      router.push("/domestic-inventory");
    } catch (err: any) {
      console.error("Error saving:", err);
      alert(err.response?.data?.error || "Failed to save product details");
    } finally {
      setSaving(false);
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product Details - Domestic</h1>
              <p className="text-sm text-gray-500 mt-1">Design Number: {designNumber}</p>
            </div>
            <button onClick={() => router.push("/domestic-inventory")} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
              ← Back to Inventory
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Product Info</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
                    className="w-full px-3 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Enter brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Fabric</label>
                  <input
                    type="text"
                    value={formData.fabric}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fabric: e.target.value }))}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Enter fabric"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-black mb-2">Composition</label>
                  <input
                    type="text"
                    value={formData.fabricComposition}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fabricComposition: e.target.value }))}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Enter composition (e.g. 80% cotton, 20% polyester)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">GSM</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.gsm}
                    onChange={(e) => setFormData((prev) => ({ ...prev, gsm: e.target.value }))}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Enter GSM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">MRP</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.mrp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, mrp: e.target.value }))}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                    placeholder="Enter MRP"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">Product Image</label>
                <div className="mt-2">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700 cursor-pointer" />
                  <p className="mt-2 text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                </div>

                {imagePreview && (
                  <div className="mt-4 relative">
                    <img src={imagePreview} alt="Preview" className="w-full h-64 object-contain border border-gray-200 rounded-lg bg-gray-50" />
                    <button type="button" onClick={() => { setImagePreview(""); setFormData((prev) => ({ ...prev, image: "" })); }} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                  {saving ? "Saving..." : jobCard ? "Update Details" : "Create Details"}
                </button>
                <button type="button" onClick={() => router.push("/domestic-inventory")} className="px-6 py-3 text-black border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-20">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Summary</h2>
              {inventory.length > 0 ? (
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-600">Total Variants</p>
                    <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
                  </div>
                  <div className="border-b pb-3">
                    <p className="text-sm text-gray-600">Total Stock</p>
                    <p className="text-2xl font-bold text-green-600">{inventory.reduce((sum, item) => sum + item.stock, 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Colors Available</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(inventory.map((i) => i.color))).map((color) => (
                        <span key={color} className="px-2 py-1 bg-gray-100 text-black text-xs rounded">{color}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Sizes Available</p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(inventory.map((i) => i.size))).map((size) => (
                        <span key={size} className="px-2 py-1 bg-gray-100 text-black text-xs rounded">{size}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No inventory data available for this design.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
