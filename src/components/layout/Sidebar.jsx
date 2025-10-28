import React from 'react';
import { LayoutDashboard, Wallet, Tag, DollarSign, Repeat, LogOut, X, BarChart3, Receipt } from 'lucide-react';
import { THEME } from '../../config/theme';

const Sidebar = ({ activeTab, setActiveTab, onSignOut, isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'charts', label: 'Charts', icon: BarChart3 },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'budgets', label: 'Budgets', icon: DollarSign },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
  ];

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    // Close mobile menu when a tab is selected
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
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
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white shadow-2xl flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Budget Tracker</h1>
            <p className="text-xs text-gray-500 mt-1">Manage your finances</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabClick(id)}
              style={{
                backgroundColor: activeTab === id ? THEME.primaryLight : 'transparent',
                color: activeTab === id ? THEME.primary : '#4b5563'
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all mb-2 ${
                activeTab === id ? 'shadow-sm' : 'hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
