import React from 'react';
import { AlertTriangle, CheckCircle, Info, ChevronDown } from 'lucide-react'; // Ensure you have lucide-react installed

// --- 1. Risk Card (For Warnings) ---
export const RiskCard = ({ title, severity, reasoning, source }: any) => {
  const isHigh = severity === 'high';
  return (
    <div className={`rounded-xl border-l-8 p-5 shadow-sm mb-4 transition-all ${
      isHigh ? 'bg-red-50 border-red-500' : 'bg-amber-50 border-amber-500'
    }`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-6 h-6 mt-1 ${isHigh ? 'text-red-600' : 'text-amber-600'}`} />
        <div>
          <h3 className={`font-bold text-lg ${isHigh ? 'text-red-800' : 'text-amber-800'}`}>
            {title}
          </h3>
          <p className="text-gray-700 mt-1 leading-relaxed">{reasoning}</p>
          {source && (
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 font-mono bg-white/50 px-2 py-1 rounded w-fit">
              <span>📚 Source:</span>
              <span className="truncate max-w-[200px]">{source}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 2. Nutrient Table (For Data) ---
export const NutrientTable = ({ items }: { items: { label: string; value: string; status?: string }[] }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex justify-between items-center">
      <span className="font-semibold text-gray-600 text-sm">Nutritional Breakdown</span>
      <Info className="w-4 h-4 text-gray-400" />
    </div>
    <div className="divide-y divide-gray-100">
      {items.map((item, idx) => (
        <div key={idx} className="flex justify-between p-4 hover:bg-gray-50 transition-colors">
          <span className="text-gray-700 font-medium">{item.label}</span>
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900">{item.value}</span>
            {item.status === 'bad' && <span className="w-2 h-2 rounded-full bg-red-500" />}
            {item.status === 'good' && <span className="w-2 h-2 rounded-full bg-green-500" />}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- 3. Safety Badge (For Quick "Yes") ---
export const SafetyBadge = ({ message }: { message: string }) => (
  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-4">
    <div className="bg-green-100 p-2 rounded-full">
      <CheckCircle className="w-6 h-6 text-green-600" />
    </div>
    <p className="text-green-800 font-medium">{message}</p>
  </div>
);