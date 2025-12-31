import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

type DietaryItem={
    name : string;
    reason : string
}
type DosAndDontsGridProps={
    condition: string;
    recommended: string[];
    avoid: string[];
}

export const DosAndDontsGrid = ({ condition, recommended, avoid }:DosAndDontsGridProps) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">Dietary Context: <span className="text-blue-600">{condition}</span></h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Do's Column */}
        <div className="p-5 border-b md:border-b-0 md:border-r border-gray-100">
          <div className="flex items-center gap-2 mb-4 text-emerald-600">
            <ThumbsUp className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm uppercase">Include These</span>
          </div>
          <ul className="space-y-3">
            {recommended.map((i, idx) => {
                const item=JSON.parse(i)
              return (
                <li key={idx} className="flex items-start gap-3 group">
                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.reason}</p>
                </div>
              </li>
              )
            })}
          </ul>
        </div>

        {/* Don'ts Column */}
        <div className="p-5 bg-rose-50/30">
          <div className="flex items-center gap-2 mb-4 text-rose-600">
            <ThumbsDown className="w-5 h-5" />
            <span className="font-bold tracking-wide text-sm uppercase">Avoid These</span>
          </div>
          <ul className="space-y-3">
            {avoid.map((i, idx) => {
                const item=JSON.parse(i)
              return (
                <li key={idx} className="flex items-start gap-3 group">
                <span className="w-1.5 h-1.5 mt-2 rounded-full bg-rose-400 group-hover:scale-150 transition-transform" />
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.reason}</p>
                </div>
              </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

// Usage Example
// <DosAndDontsGrid 
//    condition="Jaundice Recovery"
//    recommended={[{name: "Radish Leaves", reason: "Increases oxygen in blood"}, {name: "Papaya", reason: "Rich in digestive enzymes"}]}
//    avoid={[{name: "Fried Foods", reason: "Increases liver load"}, {name: "Red Meat", reason: "Hard to digest"}]}
// />