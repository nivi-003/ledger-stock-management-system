import React from 'react';

const LoadingSpinner = ({ message = 'Loading data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-100 absolute"></div>
        <div className="w-12 h-12 rounded-full border-4 border-emerald-600 border-t-transparent absolute animate-spin"></div>
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-500 animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
