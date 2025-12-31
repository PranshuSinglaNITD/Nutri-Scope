import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

type QuickVerdictProps={
    status: 'safe' | 'caution' | 'avoid';
    title: string;
    explanation: string;
    nuanceTag?: string;
}

export const QuickVerdict = ({ status, title, explanation, nuanceTag } : QuickVerdictProps) => {
  // Config based on status: 'safe', 'caution', 'avoid'
  const styles = {
    safe: {
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
      icon: <CheckCircle className="w-6 h-6 text-emerald-600" />,
      text: "text-emerald-900",
      accent: "bg-emerald-200 text-emerald-800"
    },
    caution: {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      text: "text-amber-900",
      accent: "bg-amber-200 text-amber-800"
    },
    avoid: {
      bg: "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200",
      icon: <XCircle className="w-6 h-6 text-rose-600" />,
      text: "text-rose-900",
      accent: "bg-rose-200 text-rose-800"
    }
  };

  const currentStyle = styles[status] || styles.caution;

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${currentStyle.bg} transition-all hover:shadow-md`}>
      <div className="flex items-start gap-4">
        <div className="mt-1 p-2 bg-white/60 rounded-full backdrop-blur-sm">
          {currentStyle.icon}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <h3 className={`font-bold text-lg ${currentStyle.text}`}>{title}</h3>
            {nuanceTag && (
              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${currentStyle.accent}`}>
                {nuanceTag}
              </span>
            )}
          </div>
          
          <p className={`text-sm leading-relaxed opacity-90 ${currentStyle.text}`}>
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
};