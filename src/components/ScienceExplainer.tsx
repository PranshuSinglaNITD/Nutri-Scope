import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type Props = {
  title?: string;
  explanation: string;
};

export default function ScienceExplainer({ title = 'Why this matters', explanation }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-md mb-5 overflow-hidden">
      {/* soft background glow */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-50/40 via-transparent to-transparent pointer-events-none" />

      <button
        onClick={() => setOpen((s) => !s)}
        className="relative w-full flex justify-between items-center px-4 py-4 text-left"
        aria-expanded={open}
      >
        <div>
          <div className="font-semibold text-gray-800 text-sm tracking-tight">
            {title}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Tap to learn more
          </div>
        </div>

        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* content */}
      <div
        className={`relative px-4 pb-4 text-sm text-gray-700 leading-relaxed transition-all duration-300 ease-in-out
          ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
        `}
      >
        {explanation}
      </div>
    </div>
  );
}
