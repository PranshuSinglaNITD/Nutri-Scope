import React from 'react';
import { AlertTriangle } from 'lucide-react';

type Props = {
  title: string;
  severity?: 'low' | 'medium' | 'high';
  reasoning?: string;
  source?: string;
};

export default function WarningCard({ title, severity = 'medium', reasoning, source }: Props) {
  const isHigh = severity === 'high';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-l-8 p-5 shadow-md mb-5 transition-all
        ${isHigh
          ? 'bg-linear-to-r from-red-50 to-white border-red-500'
          : 'bg-linear-to-r from-amber-50 to-white border-amber-500'}
      `}
    >
      {/* subtle alert glow */}
      <div
        className={`absolute inset-0 pointer-events-none
          ${isHigh ? 'bg-red-200/10' : 'bg-amber-200/10'}
        `}
      />

      <div className="relative flex items-start gap-4">
        {/* icon */}
        <div
          className={`flex items-center justify-center rounded-full p-2
            ${isHigh ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}
          `}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* content */}
        <div className="flex-1">
          <h3
            className={`font-bold text-base leading-snug
              ${isHigh ? 'text-red-800' : 'text-amber-800'}
            `}
          >
            {title}
          </h3>

          {reasoning && (
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">
              {reasoning}
            </p>
          )}

          {source && (
            <div className="mt-3 inline-flex items-center gap-2 text-xs text-gray-600 font-mono bg-white/70 px-3 py-1.5 rounded-full border border-gray-200">
              <span>📚 Source:</span>
              <span className="truncate max-w-50">{source}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
