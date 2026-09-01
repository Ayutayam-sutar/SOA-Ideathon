import React, { useState, useEffect, useRef } from "react";
import { PerishableCategory } from "../types";
import { Package, Sparkles } from "lucide-react";

export interface CargoSuggestion {
  name: string;
  category: PerishableCategory;
  categoryLabel: string;
  defaultTempMin: number;
  defaultTempMax: number;
  defaultShelfLifeDays: number;
  tags?: string[];
}

export const COMMON_CARGO_ITEMS: CargoSuggestion[] = [
  // Berries
  { name: "Fresh Strawberries (Grade A)", category: "berries", categoryLabel: "Fresh Berries / Strawberries", defaultTempMin: 2, defaultTempMax: 6, defaultShelfLifeDays: 5, tags: ["strawberry", "berries", "fruit"] },
  { name: "Organic Blueberries", category: "berries", categoryLabel: "Fresh Berries / Strawberries", defaultTempMin: 2, defaultTempMax: 6, defaultShelfLifeDays: 7, tags: ["blueberry", "berries"] },
  { name: "Fresh Raspberries", category: "berries", categoryLabel: "Fresh Berries / Strawberries", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 4, tags: ["raspberry", "berries"] },
  { name: "Fresh Blackberries", category: "berries", categoryLabel: "Fresh Berries / Strawberries", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 5, tags: ["blackberry", "berries"] },
  
  // Mangoes / Tropical Fruits
  { name: "Alphonso Mangoes (Export Quality)", category: "mangoes", categoryLabel: "Alphonso / Tropical Fruits", defaultTempMin: 8, defaultTempMax: 12, defaultShelfLifeDays: 14, tags: ["mango", "alphonso", "tropical"] },
  { name: "Kesar Mangoes", category: "mangoes", categoryLabel: "Alphonso / Tropical Fruits", defaultTempMin: 8, defaultTempMax: 12, defaultShelfLifeDays: 14, tags: ["mango", "kesar", "tropical"] },
  { name: "Banganapalli Mangoes", category: "mangoes", categoryLabel: "Alphonso / Tropical Fruits", defaultTempMin: 9, defaultTempMax: 13, defaultShelfLifeDays: 12, tags: ["mango", "tropical"] },
  { name: "Red Flesh Dragon Fruit", category: "mangoes", categoryLabel: "Alphonso / Tropical Fruits", defaultTempMin: 7, defaultTempMax: 10, defaultShelfLifeDays: 14, tags: ["dragon fruit", "pitaya", "tropical"] },
  { name: "Queen Pineapple", category: "mangoes", categoryLabel: "Alphonso / Tropical Fruits", defaultTempMin: 7, defaultTempMax: 11, defaultShelfLifeDays: 15, tags: ["pineapple", "tropical"] },
  { name: "Taiwan Pink Guava", category: "mangoes", categoryLabel: "Alphonso / Tropical Fruits", defaultTempMin: 8, defaultTempMax: 12, defaultShelfLifeDays: 10, tags: ["guava", "tropical"] },
  { name: "Red Lady Papaya", category: "mangoes", categoryLabel: "Alphonso / Tropical Fruits", defaultTempMin: 10, defaultTempMax: 14, defaultShelfLifeDays: 10, tags: ["papaya", "tropical"] },

  // Apples / Grapes / Stone Fruits
  { name: "Shimla Red Delicious Apples", category: "grapes", categoryLabel: "Table Grapes / Stone Fruits", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 30, tags: ["apple", "apples", "shimla"] },
  { name: "Kashmir Royal Gala Apples", category: "grapes", categoryLabel: "Table Grapes / Stone Fruits", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 30, tags: ["apple", "apples", "kashmir"] },
  { name: "Green Granny Smith Apples", category: "grapes", categoryLabel: "Table Grapes / Stone Fruits", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 35, tags: ["apple", "apples"] },
  { name: "Thompson Seedless Grapes", category: "grapes", categoryLabel: "Table Grapes / Stone Fruits", defaultTempMin: 0, defaultTempMax: 2, defaultShelfLifeDays: 21, tags: ["grape", "grapes"] },
  { name: "Black Jumbo Grapes", category: "grapes", categoryLabel: "Table Grapes / Stone Fruits", defaultTempMin: 0, defaultTempMax: 2, defaultShelfLifeDays: 21, tags: ["grape", "grapes"] },
  { name: "Sweet Red Cherries", category: "grapes", categoryLabel: "Table Grapes / Stone Fruits", defaultTempMin: 0, defaultTempMax: 2, defaultShelfLifeDays: 10, tags: ["cherry", "cherries", "stone fruit"] },
  { name: "Fresh Plums & Peaches", category: "grapes", categoryLabel: "Table Grapes / Stone Fruits", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 12, tags: ["plum", "peach", "stone fruit"] },

  // Hydroponic Salad Greens
  { name: "Hydroponic Butterhead Lettuce", category: "leafy_greens", categoryLabel: "Hydroponic Salad Greens", defaultTempMin: 2, defaultTempMax: 5, defaultShelfLifeDays: 7, tags: ["lettuce", "salad", "greens", "hydroponic"] },
  { name: "Organic Baby Spinach", category: "leafy_greens", categoryLabel: "Hydroponic Salad Greens", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 6, tags: ["spinach", "palak", "greens"] },
  { name: "Hydroponic Tuscan Kale", category: "leafy_greens", categoryLabel: "Hydroponic Salad Greens", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 8, tags: ["kale", "greens", "hydroponic"] },
  { name: "Wild Rocket / Arugula", category: "leafy_greens", categoryLabel: "Hydroponic Salad Greens", defaultTempMin: 2, defaultTempMax: 5, defaultShelfLifeDays: 6, tags: ["arugula", "rocket", "greens"] },
  { name: "Fresh Genovese Basil", category: "leafy_greens", categoryLabel: "Hydroponic Salad Greens", defaultTempMin: 8, defaultTempMax: 12, defaultShelfLifeDays: 5, tags: ["basil", "herbs", "greens"] },
  { name: "Tender Green Broccoli", category: "leafy_greens", categoryLabel: "Hydroponic Salad Greens", defaultTempMin: 0, defaultTempMax: 3, defaultShelfLifeDays: 10, tags: ["broccoli", "greens"] },

  // Exotic Tomatoes & Veggies
  { name: "Vine-Ripened Cherry Tomatoes", category: "tomatoes", categoryLabel: "Exotic Tomatoes & Veggies", defaultTempMin: 10, defaultTempMax: 14, defaultShelfLifeDays: 12, tags: ["tomato", "tomatoes", "cherry tomato"] },
  { name: "Beefsteak Tomatoes", category: "tomatoes", categoryLabel: "Exotic Tomatoes & Veggies", defaultTempMin: 10, defaultTempMax: 14, defaultShelfLifeDays: 10, tags: ["tomato", "tomatoes"] },
  { name: "Tri-Color Bell Peppers (Capsicum)", category: "tomatoes", categoryLabel: "Exotic Tomatoes & Veggies", defaultTempMin: 7, defaultTempMax: 10, defaultShelfLifeDays: 14, tags: ["capsicum", "bell pepper", "peppers"] },
  { name: "English Seedless Cucumbers", category: "tomatoes", categoryLabel: "Exotic Tomatoes & Veggies", defaultTempMin: 8, defaultTempMax: 12, defaultShelfLifeDays: 10, tags: ["cucumber", "veggies"] },
  { name: "Green & Yellow Zucchini", category: "tomatoes", categoryLabel: "Exotic Tomatoes & Veggies", defaultTempMin: 7, defaultTempMax: 10, defaultShelfLifeDays: 10, tags: ["zucchini", "veggies"] },

  // Artisanal Dairy & Cheese
  { name: "Artisanal Buffalo Paneer", category: "dairy", categoryLabel: "Artisanal Dairy & Cheese", defaultTempMin: 2, defaultTempMax: 5, defaultShelfLifeDays: 7, tags: ["paneer", "dairy", "cottage cheese"] },
  { name: "Fresh Bocconcini Mozzarella", category: "dairy", categoryLabel: "Artisanal Dairy & Cheese", defaultTempMin: 2, defaultTempMax: 4, defaultShelfLifeDays: 10, tags: ["cheese", "mozzarella", "dairy"] },
  { name: "Pasteurized Pure Cow Milk", category: "dairy", categoryLabel: "Artisanal Dairy & Cheese", defaultTempMin: 2, defaultTempMax: 4, defaultShelfLifeDays: 5, tags: ["milk", "dairy"] },
  { name: "Cultured Greek Yogurt", category: "dairy", categoryLabel: "Artisanal Dairy & Cheese", defaultTempMin: 2, defaultTempMax: 5, defaultShelfLifeDays: 14, tags: ["yogurt", "curd", "dairy"] },
  { name: "Table Salted Butter", category: "dairy", categoryLabel: "Artisanal Dairy & Cheese", defaultTempMin: 2, defaultTempMax: 6, defaultShelfLifeDays: 30, tags: ["butter", "dairy"] },

  // Fresh Button Mushrooms
  { name: "Fresh White Button Mushrooms", category: "mushrooms", categoryLabel: "Fresh Button Mushrooms", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 6, tags: ["mushroom", "button mushroom", "mushrooms"] },
  { name: "Brown Cremini / Portobello Mushrooms", category: "mushrooms", categoryLabel: "Fresh Button Mushrooms", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 7, tags: ["portobello", "cremini", "mushroom"] },
  { name: "Fresh Pearl Oyster Mushrooms", category: "mushrooms", categoryLabel: "Fresh Button Mushrooms", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 5, tags: ["oyster mushroom", "mushroom"] },
  { name: "Shiitake Mushrooms", category: "mushrooms", categoryLabel: "Fresh Button Mushrooms", defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 8, tags: ["shiitake", "mushroom"] }
];

export function detectCategoryFromCargo(cargoDescription: string): CargoSuggestion | null {
  if (!cargoDescription || !cargoDescription.trim()) return null;
  const lower = cargoDescription.toLowerCase().trim();

  // 1. Direct exact or substring match in common cargo list
  for (const item of COMMON_CARGO_ITEMS) {
    if (lower.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(lower)) {
      return item;
    }
  }

  // 2. Keyword check against item tags
  for (const item of COMMON_CARGO_ITEMS) {
    if (item.tags?.some(tag => lower.includes(tag))) {
      return item;
    }
  }

  // 3. Fallback generic category keyword map
  if (lower.includes('strawber') || lower.includes('blueber') || lower.includes('raspber') || lower.includes('blackber') || lower.includes('berr')) {
    return { name: cargoDescription, category: 'berries', categoryLabel: 'Fresh Berries / Strawberries', defaultTempMin: 2, defaultTempMax: 6, defaultShelfLifeDays: 5 };
  }
  if (lower.includes('mango') || lower.includes('alphonso') || lower.includes('kesar') || lower.includes('papaya') || lower.includes('guava') || lower.includes('pineapple') || lower.includes('dragon')) {
    return { name: cargoDescription, category: 'mangoes', categoryLabel: 'Alphonso / Tropical Fruits', defaultTempMin: 8, defaultTempMax: 12, defaultShelfLifeDays: 14 };
  }
  if (lower.includes('apple') || lower.includes('grape') || lower.includes('cherry') || lower.includes('cherries') || lower.includes('plum') || lower.includes('peach') || lower.includes('pear') || lower.includes('apricot')) {
    return { name: cargoDescription, category: 'grapes', categoryLabel: 'Table Grapes / Stone Fruits', defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 25 };
  }
  if (lower.includes('lettuce') || lower.includes('spinach') || lower.includes('kale') || lower.includes('salad') || lower.includes('arugula') || lower.includes('basil') || lower.includes('broccoli') || lower.includes('greens') || lower.includes('palak')) {
    return { name: cargoDescription, category: 'leafy_greens', categoryLabel: 'Hydroponic Salad Greens', defaultTempMin: 2, defaultTempMax: 5, defaultShelfLifeDays: 7 };
  }
  if (lower.includes('tomato') || lower.includes('capsicum') || lower.includes('pepper') || lower.includes('cucumber') || lower.includes('zucchini')) {
    return { name: cargoDescription, category: 'tomatoes', categoryLabel: 'Exotic Tomatoes & Veggies', defaultTempMin: 9, defaultTempMax: 13, defaultShelfLifeDays: 10 };
  }
  if (lower.includes('paneer') || lower.includes('cheese') || lower.includes('milk') || lower.includes('butter') || lower.includes('curd') || lower.includes('yogurt') || lower.includes('dairy')) {
    return { name: cargoDescription, category: 'dairy', categoryLabel: 'Artisanal Dairy & Cheese', defaultTempMin: 2, defaultTempMax: 5, defaultShelfLifeDays: 7 };
  }
  if (lower.includes('mushroom') || lower.includes('shiitake') || lower.includes('oyster') || lower.includes('portobello') || lower.includes('cremini')) {
    return { name: cargoDescription, category: 'mushrooms', categoryLabel: 'Fresh Button Mushrooms', defaultTempMin: 1, defaultTempMax: 4, defaultShelfLifeDays: 6 };
  }

  return null;
}

interface CargoAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (item: CargoSuggestion) => void;
  placeholder?: string;
  required?: boolean;
}

export const CargoAutocomplete: React.FC<CargoAutocompleteProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "e.g. Alphonso Mangoes Grade A or Shimla Apples",
  required = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter items matching input
  const suggestions = React.useMemo(() => {
    if (!value || !value.trim()) {
      return COMMON_CARGO_ITEMS.slice(0, 8); // Show top popular items when empty
    }
    const query = value.toLowerCase().trim();
    return COMMON_CARGO_ITEMS.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.categoryLabel.toLowerCase().includes(query) ||
      item.tags?.some(tag => tag.includes(query))
    );
  }, [value]);

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

  const handleSelect = (item: CargoSuggestion) => {
    onChange(item.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-[#5C7A50]/20 focus:border-[#5C7A50] transition-shadow shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <Sparkles className="w-4 h-4 text-[#5C7A50]" />
        </div>
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white border border-[#D6DCD4] rounded-xl shadow-xl divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 bg-[#F8FAF7] border-b border-[#E5EBE3] text-[10px] font-mono uppercase tracking-wider text-[#596560] flex items-center justify-between">
            <span>Recommended Perishable Items</span>
            <span>{suggestions.length} items</span>
          </div>
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            return (
              <div
                key={item.name}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                  isHighlighted ? "bg-[#5C7A50]/10 text-[#163832]" : "hover:bg-gray-50 text-gray-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${isHighlighted ? "bg-[#5C7A50] text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-[#163832]">{item.name}</div>
                    <div className="text-[10px] text-[#596560]">{item.categoryLabel}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {item.defaultTempMin}°C to {item.defaultTempMax}°C
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.defaultShelfLifeDays}d Shelf
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
