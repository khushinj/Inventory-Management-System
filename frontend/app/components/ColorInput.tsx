"use client";

import React, { useRef, useEffect, useState } from "react";
import { ColorOption } from "../hooks/useJobCardColors";

interface ColorInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => void;
  colorOptions: ColorOption[];
  hasJobCard: boolean;
  loading?: boolean;
  placeholder?: string;
  className?: string;
  ref?: React.Ref<HTMLInputElement | HTMLSelectElement>;
}

export const ColorInput = React.forwardRef<
  HTMLInputElement | HTMLSelectElement,
  ColorInputProps
>(
  (
    {
      value,
      onChange,
      onKeyDown,
      colorOptions,
      hasJobCard,
      loading = false,
      placeholder = "Color",
      className = "w-full px-2 py-1 border rounded text-black bg-white",
    },
    ref
  ) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Show dropdown when there are jobcard colors
    useEffect(() => {
      setShowDropdown(hasJobCard && colorOptions.length > 0 && !loading);
    }, [hasJobCard, colorOptions, loading]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setShowDropdown(false);
        }
      };

      if (showDropdown) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [showDropdown]);

    if (loading) {
      return (
        <div
          className={className}
          style={{ display: "flex", alignItems: "center" }}
        >
          <span className="text-sm text-gray-500">Loading colors...</span>
        </div>
      );
    }

    if (showDropdown && colorOptions.length > 0) {
      return (
        <div ref={containerRef} className="relative w-full">
          <select
            ref={ref as React.Ref<HTMLSelectElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            className={className}
          >
            <option value="">{placeholder}</option>
            {colorOptions.map((option, index) => (
              <option key={index} value={option.color}>
                {option.color}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {colorOptions.length} color{colorOptions.length !== 1 ? "s" : ""} available from jobcard
          </p>
        </div>
      );
    }

    // Default text input for manual entry
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);

ColorInput.displayName = "ColorInput";
