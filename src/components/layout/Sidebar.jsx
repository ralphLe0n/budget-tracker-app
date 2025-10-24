import React from 'react';
import { LayoutDashboard, Wallet, Tag, DollarSign, Repeat, LogOut } from 'lucide-react';
import { THEME } from '../../config/theme';

const Sidebar = ({ activeTab, setActiveTab, onSignOut }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'budgets', label: 'Budgets', icon: DollarSign },
    { id: 'recurring', label: 'Recurring', icon: Repeat },
  ];

  return (
    <div className="w-64 bg-white shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Budget Tracker</h1>
        <p className="text-xs text-gray-500 mt-1">Manage your finances</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
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
  );
};

export default Sidebar;
