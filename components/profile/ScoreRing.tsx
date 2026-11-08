// /components/profile/ScoreRing.tsx
import React from 'react';

interface ScoreRingProps {
  score: number; // 0 to 100
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = 283 - (283 * clampedScore) / 100;

  return (
    <div className="relative flex flex-col items-center justify-center w-36 h-36">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#2563eb"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray="283"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gray-900">{clampedScore}</span>
        <span className="text-xs text-gray-500 font-medium">D'arjo score</span>
      </div>
    </div>
  );
};