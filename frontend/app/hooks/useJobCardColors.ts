"use client";

import { useState, useCallback } from "react";
import { api } from "../../lib/api";

export interface ColorOption {
  color: string;
  quantity: number;
}

export const useJobCardColors = () => {
  const [colorOptions, setColorOptions] = useState<ColorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasJobCard, setHasJobCard] = useState(false);

  const fetchColorsForDesignNumber = useCallback(
    async (designNumber: string) => {
      if (!designNumber.trim()) {
        setColorOptions([]);
        setHasJobCard(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await api.get("/jobcard/search", {
          params: { query: designNumber },
        });

        const jobCards = Array.isArray(response.data) ? response.data : [];

        if (jobCards.length > 0) {
          const jobCard = jobCards[0]; // Use first matching jobcard
          const colors = jobCard.cutting && Array.isArray(jobCard.cutting)
            ? jobCard.cutting.map((item: { color: string; quantity: number }) => ({
                color: item.color,
                quantity: item.quantity,
              }))
            : [];

          setColorOptions(colors);
          setHasJobCard(colors.length > 0);
        } else {
          setColorOptions([]);
          setHasJobCard(false);
        }
      } catch (err) {
        console.error("Error fetching colors for design number:", err);
        setError("Failed to fetch colors from jobcard");
        setColorOptions([]);
        setHasJobCard(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const resetColors = useCallback(() => {
    setColorOptions([]);
    setHasJobCard(false);
    setError(null);
    setLoading(false);
  }, []);

  return {
    colorOptions,
    loading,
    error,
    hasJobCard,
    fetchColorsForDesignNumber,
    resetColors,
  };
};
