"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "../../lib/api";
import { Search } from "lucide-react";

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
              <JobCardItem key={card._id} card={card} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type JobCardItemProps = {
  card: JobCard;
};

function JobCardItem({ card }: JobCardItemProps) {
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
            {/* Design Number - Header */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {card.designNumber.toUpperCase()}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Created: {new Date(card.createdAt).toLocaleDateString("en-GB")}
              </p>
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
