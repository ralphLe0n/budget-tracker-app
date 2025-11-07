import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { CATEGORY_ICONS } from '../../constants/categoryOptions';
import { THEME } from '../../config/theme';

const IconPicker = ({ selected, onSelect, color }) => {
  const [isOpen, setIsOpen] = useState(false);

  const SelectedIcon = Icons[selected] || Icons.Tag;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color + '20' }}
          >
            <SelectedIcon size={24} style={{ color }} />
          </div>
          <span className="text-gray-700 font-medium">
            {CATEGORY_ICONS.find(i => i.name === selected)?.label || 'Select Icon'}
          </span>
        </div>
        <Icons.ChevronDown size={20} className="text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2 p-4">
              {CATEGORY_ICONS.map((icon) => {
                const IconComponent = Icons[icon.name];
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => {
                      onSelect(icon.name);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-lg transition-all hover:scale-110 ${
                      selected === icon.name ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: selected === icon.name ? color + '30' : color + '10',
                      ringColor: color
                    }}
                    title={icon.label}
                  >
                    <IconComponent size={24} style={{ color }} />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IconPicker;
