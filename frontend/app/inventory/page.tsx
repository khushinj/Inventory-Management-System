"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "../../lib/api";

type JobCard = {
  _id: string;
  designNumber: string;
  brand: string;
  fabric: string;
  fabricComposition: string;
  gsm: number;
  mrp: number;
  image?: string;
  createdAt: string;
};

const FABRIC_TYPES = [
  "Cotton Blend",
  "Denim",
  "Wool",
  "Silk",
  "Linen",
  "Pure Cotton",
  "Polyester",
  "Rayon",
  "Viscose",
  "Lycra Blend",
];

const MRP_RANGES = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "Under ₹1000", min: 0, max: 1000 },
  { label: "Until ₹2k", min: 0, max: 2000 },
  { label: "Until ₹3k", min: 0, max: 3000 },

  { label: "Till ₹5k", min: 4000, max: 5000 },
];

export default function InventoryPage() {
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedMrpRange, setSelectedMrpRange] = useState<number | null>(null);

  useEffect(() => {
    fetchJobCards();
  }, []);

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const response = await api.get("/jobcard");
      setJobCards(response.data);
    } catch (err) {
      console.error("Error fetching job cards:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFabric = (fabric: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(fabric)
        ? prev.filter((f) => f !== fabric)
        : [...prev, fabric]
    );
  };

  const toggleMrpRange = (index: number) => {
    setSelectedMrpRange(selectedMrpRange === index ? null : index);
  };

  const filteredJobCards = jobCards
    .filter((card) => {
      const matchesSearch =
        card.designNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.fabric.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFabric =
        selectedFabrics.length === 0 ||
        selectedFabrics.some((f) =>
          card.fabric.toLowerCase().includes(f.toLowerCase())
        );

      let matchesMrp = true;
      if (selectedMrpRange !== null) {
        const range = MRP_RANGES[selectedMrpRange];
        matchesMrp = card.mrp >= range.min && card.mrp <= range.max;
      }

      return matchesSearch && matchesFabric && matchesMrp;
    })
    .slice(0,30);

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">View Inventory</h1>
            <p className="text-sm text-gray-500">All job card entries</p>
          </div>
        </div>
      </div>


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


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

          <aside className="bg-white border rounded-lg shadow-sm p-6 h-fit sticky top-20 self-start">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Filters</h2>


            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Fabric Type</h3>
              <div className="space-y-3">
                {FABRIC_TYPES.map((fabric) => (
                  <label key={fabric} className="flex items-center gap-3 text-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedFabrics.includes(fabric)}
                      onChange={() => toggleFabric(fabric)}
                      className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-800"
                    />
                    <span>{fabric}</span>
                  </label>
                ))}
              </div>
            </div>


            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">MRP Range</h3>
              <div className="space-y-3">
                {MRP_RANGES.map((range, index) => (
                  <label key={range.label} className="flex items-center gap-3 text-gray-800">
                    <input
                      type="radio"
                      name="mrp"
                      checked={selectedMrpRange === index}
                      onChange={() => toggleMrpRange(index)}
                      className="w-4 h-4 border-gray-300 text-gray-900 focus:ring-gray-800"
                    />
                    <span>{range.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {(selectedFabrics.length > 0 || selectedMrpRange !== null) && (
              <button
                onClick={() => {
                  setSelectedFabrics([]);
                  setSelectedMrpRange(null);
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-semibold"
              >
                Clear Filters
              </button>
            )}
          </aside>


          <div className="space-y-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
                <p className="mt-4 text-gray-600">Loading inventory...</p>
              </div>
            ) : filteredJobCards.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search term</p>
              </div>
            ) : (
              filteredJobCards.map((card) => (
                <div key={card._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                  <div className="md:flex md:gap-10 p-6">
                    <div className="md:w-1/2 w-full">
                      <div className="relative w-full h-[520px] bg-gray-100 rounded-lg overflow-hidden">
                        {card.image ? (
                          <Image src={card.image} alt={card.designNumber} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">No Image</div>
                        )}
                      </div>
                    </div>

                    <div className="md:w-1/2 w-full mt-6 md:mt-0 space-y-6">
                      <DetailBlock label="Design Number" value={card.designNumber} />
                      <DetailBlock label="Brand" value={card.brand} />
                      <DetailBlock label="Fabric" value={card.fabric} />
                      <DetailBlock label="Fabric Composition" value={card.fabricComposition} />
                      <DetailBlock label="GSM" value={card.gsm} />
                      <DetailBlock label="MRP" value={`₹${card.mrp}`} />
                    </div>
                  </div>
                </div>
              ))
            )}

            {!loading && filteredJobCards.length > 0 && (
              <div className="text-center text-gray-600">Showing {filteredJobCards.length} of {jobCards.length} products</div>
            )}
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