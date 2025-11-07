import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { CATEGORY_COLORS } from '../../constants/categoryOptions';

const ColorPicker = ({ selected, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedColor = CATEGORY_COLORS.find(c => c.value === selected) || CATEGORY_COLORS[0];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg border-2 border-gray-200"
            style={{ backgroundColor: selected }}
          />
          <span className="text-gray-700 font-medium">{selectedColor.name}</span>
        </div>
        <ChevronDown size={20} className="text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <div className="grid grid-cols-4 gap-3 p-4">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    onSelect(color.value);
                    setIsOpen(false);
                  }}
                  className={`relative p-2 rounded-lg transition-all hover:scale-110 border-2 ${
                    selected === color.value ? 'border-gray-600' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selected === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check size={20} className="text-white drop-shadow-lg" />
                    </div>
                  )}
                  <div className="h-8" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ColorPicker;
