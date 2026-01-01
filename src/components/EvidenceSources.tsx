"use client";

import { ShieldCheck, ExternalLink, Info } from "lucide-react";

/* ---------------------------------------------
   Types
--------------------------------------------- */
export type EvidenceSource = {
  title: string;
  authority: "WHO" | "FDA" | "ICMR" | "NIH" | "Peer-Reviewed";
  description: string;
  confidence: number; // 0–100
  url?: string;
};

interface EvidenceSourcesProps {
  sources?: (EvidenceSource | string)[]; // 👈 string allowed (AI output)
}

/* ---------------------------------------------
   Styling helpers
--------------------------------------------- */
const authorityColorMap: Record<EvidenceSource["authority"], string> = {
  WHO: "bg-emerald-100 text-emerald-700",
  FDA: "bg-blue-100 text-blue-700",
  ICMR: "bg-purple-100 text-purple-700",
  NIH: "bg-cyan-100 text-cyan-700",
  "Peer-Reviewed": "bg-amber-100 text-amber-700",
};

/* ---------------------------------------------
   Component
--------------------------------------------- */
export default function EvidenceSources({ sources }: EvidenceSourcesProps) {
  /* -------------------------------------------------------
     1️⃣ HARD SAFETY CHECK
     ------------------------------------------------------- */
  if (!Array.isArray(sources)) return null;

  /* -------------------------------------------------------
     2️⃣ NORMALIZE AI OUTPUT
     - Parse stringified JSON
     - Drop unparsable values
     ------------------------------------------------------- */
  const normalizedSources = sources
    .map((src) => {
      if (typeof src === "string") {
        try {
          return JSON.parse(src);
        } catch {
          return null;
        }
      }
      return src;
    })
    .filter(Boolean);

  /* -------------------------------------------------------
     3️⃣ VALIDATE STRUCTURE
     ------------------------------------------------------- */
  const validSources = normalizedSources.filter(
    (src): src is EvidenceSource =>
      typeof src.title === "string" &&
      typeof src.description === "string" &&
      typeof src.confidence === "number" &&
      src.confidence >= 0 &&
      src.confidence <= 100 &&
      typeof src.authority === "string" &&
      src.authority in authorityColorMap
  );

  /* -------------------------------------------------------
     4️⃣ FAIL SILENTLY IF NOTHING VALID
     ------------------------------------------------------- */
  if (validSources.length === 0) return null;

  /* -------------------------------------------------------
     5️⃣ RENDER UI
     ------------------------------------------------------- */
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-emerald-600" size={18} />
        <h3 className="font-semibold text-sm text-gray-800">
          Evidence & Sources
        </h3>
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <Info size={12} />
          Trust Layer
        </span>
      </div>

      {/* Sources */}
      <div className="space-y-3">
        {validSources.map((src, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-gray-100 p-3 bg-white hover:bg-gray-50 transition"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {src.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {src.description}
                </p>
              </div>

              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${authorityColorMap[src.authority]}`}
              >
                {src.authority}
              </span>
            </div>

            {/* Confidence + Link */}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Confidence:{" "}
                <span className="font-semibold text-gray-700">
                  {src.confidence}%
                </span>
              </div>

              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-emerald-600 font-medium flex items-center gap-1 hover:underline"
                >
                  View source
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
