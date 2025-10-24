import React from 'react';

const ErrorDisplay = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border-2 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md z-50">
      <div className="flex items-start gap-3">
        <span className="font-bold">Error:</span>
        <div className="flex-1">
          <p>{error}</p>
          <button
            onClick={onDismiss}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
