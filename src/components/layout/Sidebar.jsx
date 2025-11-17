import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wallet, Tag, DollarSign, Repeat, LogOut, X, Receipt, GripVertical, CreditCard } from 'lucide-react';
import { THEME } from '../../config/theme';

const Sidebar = ({ activeTab, setActiveTab, onSignOut, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const defaultNavItems = [
    { id: 'dashboard', label: 'Panel Główny', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transakcje', icon: Receipt },
    { id: 'accounts', label: 'Konta', icon: Wallet },
    { id: 'categories', label: 'Kategorie', icon: Tag },
    { id: 'budgets', label: 'Budżety', icon: DollarSign },
    { id: 'recurring', label: 'Cykliczne', icon: Repeat },
    { id: 'debts', label: 'Długi', icon: CreditCard },
  ];

  const [navItems, setNavItems] = useState(() => {
    // Load saved order from localStorage
    const savedOrder = localStorage.getItem('navTabOrder');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder);
        // Reorder navItems based on saved order
        const orderedItems = orderIds
          .map(id => defaultNavItems.find(item => item.id === id))
          .filter(Boolean);

        // Add any new items that weren't in the saved order
        defaultNavItems.forEach(item => {
          if (!orderedItems.find(ordered => ordered.id === item.id)) {
            orderedItems.push(item);
          }
        });

        return orderedItems;
      } catch (e) {
        return defaultNavItems;
      }
    }
    return defaultNavItems;
  });

  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    // Close mobile menu when a tab is selected
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, item) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem(item);
  };

  const handleDrop = (e, targetItem) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    const draggedIndex = navItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = navItems.findIndex(item => item.id === targetItem.id);

    const newNavItems = [...navItems];
    newNavItems.splice(draggedIndex, 1);
    newNavItems.splice(targetIndex, 0, draggedItem);

    setNavItems(newNavItems);

    // Save to localStorage
    const orderIds = newNavItems.map(item => item.id);
    localStorage.setItem('navTabOrder', JSON.stringify(orderIds));

    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedOverItem(null);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:sticky md:top-0 inset-y-0 left-0 z-50
        w-64 bg-white shadow-2xl flex flex-col md:h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Zarządzanie Budżetem</h1>
            <p className="text-xs text-gray-500 mt-1">Zarządzaj swoimi finansami</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Zamknij menu"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <div
              key={id}
              draggable
              onDragStart={(e) => handleDragStart(e, { id, label, icon: Icon })}
              onDragOver={(e) => handleDragOver(e, { id, label, icon: Icon })}
              onDrop={(e) => handleDrop(e, { id, label, icon: Icon })}
              onDragEnd={handleDragEnd}
              className={`mb-2 rounded-lg transition-all ${
                draggedOverItem?.id === id ? 'border-2 border-dashed border-blue-400' : ''
              }`}
            >
              <button
                onClick={() => handleTabClick(id)}
                style={{
                  backgroundColor: activeTab === id ? THEME.primaryLight : 'transparent',
                  color: activeTab === id ? THEME.primary : '#4b5563'
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === id ? 'shadow-sm' : 'hover:bg-gray-100'
                }`}
              >
                <GripVertical size={16} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                <Icon size={20} />
                {label}
              </button>
            </div>
          ))}
        </nav>

        {/* Logout Button - Sticky at bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={20} />
            Wyloguj
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
