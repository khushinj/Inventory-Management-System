"use client";

import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const AutocompleteInput = forwardRef<HTMLInputElement, Props>(
  (
    {
      value,
      onChange,
      onSelect,
      options,
      placeholder,
      className,
      onKeyDown,
    },
    ref
  ) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const filteredOptions = useMemo(() => {
      const unique = [...new Set(options.filter(Boolean))];

      if (!value.trim()) {
        return unique.sort();
      }

      const search = value.toLowerCase();

      return unique
        .filter((option) =>
          option.toLowerCase().includes(search)
        )
        .sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(search);
          const bStarts = b.toLowerCase().startsWith(search);

          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          return a.localeCompare(b);
        });
    }, [options, value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);

      return () =>
        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );
    }, []);

    const handleKeyDown = (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (isOpen && filteredOptions.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
            return;

          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
            return;

          case "Enter":
            if (selectedIndex >= 0) {
              e.preventDefault();

              const selected = filteredOptions[selectedIndex];

              onChange(selected);
              onSelect?.(selected);

              setIsOpen(false);
              setSelectedIndex(-1);

              return;
            }
            break;

          case "Escape":
            setIsOpen(false);
            return;
        }
      }

      onKeyDown?.(e);
    };

    return (
      <div
        ref={wrapperRef}
        className="relative w-full"
      >
        <input
          ref={ref}
          type="text"
          value={value}
          placeholder={placeholder}
          className={className}
          autoComplete="off"
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg">
            {filteredOptions.map((option, index) => (
              <div
                key={option}
                onMouseDown={() => {
                  onChange(option);
                  onSelect?.(option);
                  setIsOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 ${index === selectedIndex
                  ? "bg-blue-500"
                  : "hover:bg-blue-100 text-black"
                  }`}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

AutocompleteInput.displayName = "AutocompleteInput";

export default AutocompleteInput;