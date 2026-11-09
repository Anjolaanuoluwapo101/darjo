"use client";

type ScoreRingProps = {
  score: number;
  size?: number;
  label?: string;
};

// Ring that shows the D'arjo score as a ring around the number.
export default function ScoreRing({
  score,
  size = 160,
  label = "D'arjo score",
}: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0070e0"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold tracking-tight text-[#001c64]">
          {clamped}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
      </div>
    </div>
  );
}
