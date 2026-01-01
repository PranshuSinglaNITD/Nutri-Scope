"use client";

import { Clock, AlertTriangle, Activity } from "lucide-react";

type Impact = {
  effect: string;
  explanation: string;
  severity: "low" | "medium" | "high";
};

type Props = {
  title?: string;
  timeframe?: string;
  impacts?: (Impact | string)[];
};

const severityStyles = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

export default function LongTermImpactCard({
  title = "Long-Term Health Impact",
  timeframe,
  impacts,
}: Props) {
  /* -------------------------------------------------------
     1️⃣ HARD SAFETY CHECK
     ------------------------------------------------------- */
  if (!Array.isArray(impacts)) return null;

  /* -------------------------------------------------------
     2️⃣ NORMALIZE AI OUTPUT (PARSE STRINGS)
     ------------------------------------------------------- */
  const normalizedImpacts = impacts
    .map((item) => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item);
        } catch {
          return null;
        }
      }
      return item;
    })
    .filter(Boolean);

  /* -------------------------------------------------------
     3️⃣ VALIDATE STRUCTURE
     ------------------------------------------------------- */
  const validImpacts = normalizedImpacts.filter(
    (i): i is Impact =>
      typeof i.effect === "string" &&
      typeof i.explanation === "string" &&
      i.explanation.trim().length >= 30 &&
      i.severity === "low" ||
      i.severity === "medium" ||
      i.severity === "high"
  );

  /* -------------------------------------------------------
     4️⃣ FAIL SILENTLY
     ------------------------------------------------------- */
  if (validImpacts.length === 0) return null;

  /* -------------------------------------------------------
     5️⃣ RENDER
     ------------------------------------------------------- */
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="text-indigo-600" size={18} />
        <h3 className="font-semibold text-sm text-gray-800">{title}</h3>
        {timeframe && (
          <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
            <Clock size={12} />
            {timeframe}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {validImpacts.map((impact, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-3 ${severityStyles[impact.severity]}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} />
              <p className="text-sm font-semibold">{impact.effect}</p>
            </div>

            <p className="text-xs leading-relaxed">
              {impact.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
