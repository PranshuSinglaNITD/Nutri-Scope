import React from 'react';

type Props = {
  score: number; // 0-100
  tips?: string[];
};

export default function NutritionScore({ score, tips = [] }: Props) {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  const color = normalized >= 75 ? 'bg-emerald-400' : normalized >= 50 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-md p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Nutrition Score</h4>
          <p className="text-xs text-gray-500">A quick heuristic of overall healthiness</p>
        </div>
        <div className="text-sm font-bold text-gray-800">{normalized}/100</div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-3">
        <div className={`h-3 ${color}`} style={{ width: `${normalized}%` }} />
      </div>

      {tips.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1">
          {tips.slice(0, 3).map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="text-emerald-500">•</div>
              <div>{t}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
