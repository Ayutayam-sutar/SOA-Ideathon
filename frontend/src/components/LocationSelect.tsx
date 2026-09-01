import React, { useState, useEffect, useRef } from "react";
import { Hub } from "../types";
import { MapPin, Search, ChevronDown, Check, Snowflake, Train, Warehouse } from "lucide-react";

interface LocationSelectProps {
  hubs: Hub[];
  value: string;
  onChange: (hubName: string, selectedHub?: Hub) => void;
  placeholder?: string;
  required?: boolean;
  type?: "origin" | "destination";
}

export const LocationSelect: React.FC<LocationSelectProps> = ({
  hubs,
  value,
  onChange,
  placeholder = "Select verified hub...",
  required = true,
  type = "origin"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter hubs matching search query
  const filteredHubs = React.useMemo(() => {
    if (!searchQuery.trim()) return hubs;
    const q = searchQuery.toLowerCase().trim();
    return hubs.filter(h => 
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      (h.hubCode && h.hubCode.toLowerCase().includes(q))
    );
  }, [hubs, searchQuery]);

  // Selected hub object
  const selectedHub = hubs.find(h => h.name.toLowerCase() === (value || "").toLowerCase() || h.name === value);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (hub: Hub) => {
    onChange(hub.name, hub);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Hidden input for HTML5 form validation */}
      {required && (
        <input
          type="text"
          value={value}
          required={required}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Main Select Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-lg px-4 py-2.5 text-left flex items-center justify-between transition-all shadow-sm ${
          isOpen ? "ring-2 ring-[#5C7A50]/20 border-[#5C7A50]" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <MapPin className={`w-4 h-4 shrink-0 ${type === "origin" ? "text-[#5C7A50]" : "text-[#D98E2B]"}`} />
          {selectedHub ? (
            <div className="truncate">
              <span className="font-semibold text-xs text-[#163832]">{selectedHub.name}</span>
              <span className="text-[11px] text-[#596560] ml-1.5">({selectedHub.city})</span>
            </div>
          ) : value ? (
            <span className="font-semibold text-xs text-[#163832] truncate">{value}</span>
          ) : (
            <span className="text-xs text-gray-400 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 bg-white border border-[#D6DCD4] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Search bar inside dropdown */}
          <div className="p-2.5 border-b border-[#E5EBE3] bg-[#F8FAF7]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hub name or city..."
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#5C7A50] focus:border-[#5C7A50]"
              />
            </div>
          </div>

          {/* List of Hubs */}
          <div className="overflow-y-auto max-h-56 divide-y divide-gray-100">
            {filteredHubs.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500">
                No verified hubs matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredHubs.map((hub) => {
                const isSelected = selectedHub?.id === hub.id || hub.name.toLowerCase() === (value || "").toLowerCase();
                return (
                  <div
                    key={hub.id}
                    onClick={() => handleSelect(hub)}
                    className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? "bg-[#5C7A50]/10 text-[#163832]" : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-[#5C7A50] text-white" : "bg-gray-100 text-gray-500"}`}>
                        <Warehouse className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-[#163832] truncate">{hub.name}</div>
                        <div className="text-[10px] text-[#596560] font-mono">{hub.city} • Cap: {hub.capacityKg ? `${hub.capacityKg.toLocaleString()}kg` : 'Multi-ton'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hub.coldStorage && (
                        <span className="p-1 rounded bg-blue-50 text-blue-600 border border-blue-200" title="Cold Storage Available">
                          <Snowflake className="w-3 h-3" />
                        </span>
                      )}
                      {hub.railAccess && (
                        <span className="p-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-200" title="Kisan Rail Multimodal Access">
                          <Train className="w-3 h-3" />
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#5C7A50] ml-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
