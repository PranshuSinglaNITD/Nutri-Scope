import React from 'react';

type Suggestion = { title: string; reason?: string; link?: string };

type Props = {
  suggestions: Suggestion[];
};

export default function AlternativeSuggestionCard({ suggestions }: {suggestions : string[]}) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-200 shadow-md p-5 mb-5 overflow-hidden">
      {/* soft background glow */}
      <div className="absolute inset-0 bg-linear-to-br from-emerald-50/40 via-transparent to-transparent pointer-events-none" />

      {/* header */}
      <div className="relative flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 text-base tracking-tight">
          Alternative Suggestions
        </h4>
        <button className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition">
          View Product →
        </button>
      </div>

      {/* suggestions */}
      <div className="relative space-y-3">
        {suggestions.map((suggestion, i) => {
          const s = JSON.parse(suggestion);

          const handleOpen = (e?: React.MouseEvent) => {
            if (e) e.stopPropagation();
            // Always perform a Google search for the suggestion title to avoid local navigation
            const q = encodeURIComponent(`${s.title}${s.reason ? ' ' + s.reason : ''}`);
            const url = `https://www.google.com/search?q=${q}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          };

          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={handleOpen}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpen(); }}
              className="group p-4 rounded-xl bg-linear-to-r from-emerald-50 to-white border border-emerald-100 hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium text-gray-900 leading-snug">
                    {s.title}
                  </div>

                  {s.reason && (
                    <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {s.reason}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition group-hover:underline">
                  Open
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
