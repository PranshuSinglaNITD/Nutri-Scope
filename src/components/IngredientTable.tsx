import React from 'react';
import { Info } from 'lucide-react';

type Item = { label: string; value: string; status?: 'good' | 'bad' };
type Props = { items: Item[] };

export default function IngredientTable({ items }: Props) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden mb-5">
      {/* subtle background glow */}
      <div className="absolute inset-0 bg-linear-to-br from-gray-50/40 via-transparent to-transparent pointer-events-none" />

      {/* header */}
      <div className="relative bg-linear-to-r from-gray-50 to-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <span className="font-semibold text-gray-700 text-sm tracking-tight">
          Nutritional Breakdown
        </span>
        <Info className="w-4 h-4 text-gray-400" />
      </div>

      {/* rows */}
      <div className="relative divide-y divide-gray-100">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center px-4 py-3 hover:bg-gray-50/60 transition-colors"
          >
            <span className="text-gray-800 font-medium">
              {item.label}
            </span>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">
                {item.value}
              </span>

              {item.status === 'bad' && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
              )}

              {item.status === 'good' && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
