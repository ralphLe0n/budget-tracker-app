import React from 'react';
import { THEME } from '../../config/theme';

const LoadingOverlay = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <div className="flex items-center gap-3">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: THEME.primary }}
          ></div>
          <span className="text-gray-700 font-medium">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
