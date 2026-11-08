// /components/agent/CircleDrawer.tsx
'use client';

import React from 'react';

interface CircleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  circleData: {
    id: string;
    name: string;
    amount: string;
    membersCount: number;
    riskScore: string;
    disclaimer?: string;
  } | null;
}

export const CircleDrawer: React.FC<CircleDrawerProps> = ({ isOpen, onClose, circleData }) => {
  if (!isOpen || !circleData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-2xl p-6 space-y-4 shadow-xl transform transition-transform animate-slide-up">
        {/* Top Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-2" />

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{circleData.name}</h2>
            <p className="text-sm text-gray-500">Circle Details & Risk Profile</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-xl px-2"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-xs text-gray-500 block">Monthly Contribution</span>
            <span className="text-lg font-bold text-gray-900">{circleData.amount}</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <span className="text-xs text-gray-500 block">Members</span>
            <span className="text-lg font-bold text-gray-900">{circleData.membersCount} Active</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center justify-between">
          <span className="text-xs font-semibold text-blue-900">Currency Volatility Rating</span>
          <span className="text-xs font-bold px-2.5 py-1 bg-blue-600 text-white rounded-full">
            {circleData.riskScore}
          </span>
        </div>

        {circleData.disclaimer && (
          <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded border">
            {circleData.disclaimer}
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};