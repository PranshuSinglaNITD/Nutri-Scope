"use client";

import { useEffect, useState } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import {
  RiskCard,
  NutrientTable,
  SafetyBadge,
  WarningCard,
  IngredientTable,
  HealthBadge,
  ScienceExplainer,
  AlternativeSuggestionCard,
} from "@/components/dumbComponents";
import { z } from "zod";
import { Camera, Loader2, Sparkles, X } from "lucide-react";

// 1️⃣ Component registry
const COMPONENT_MAP: Record<string, React.FC<any>> = {
  // legacy names
  RiskCard,
  NutrientTable,
  SafetyBadge,
  // new canonical names
  WarningCard,
  IngredientTable,
  HealthBadge,
  ScienceExplainer,
  AlternativeSuggestionCard,
};

// 2️⃣ Lightweight schema (frontend does NOT need full strictness)
const analysisSchema = z.object({
  uiComponents: z.array(
    z.object({
      component: z.string(),
      props: z.any(),
    })
  ),
});

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  // 3️⃣ useObject hook (THIS replaces axios)
  const { object, submit, isLoading, error } = useObject({
    api: "/api/ai-response",
    schema: analysisSchema,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64.split(",")[1]); // 👈 IMPORTANT
    };
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setImagePreview(null);
    setImageBase64(null);
    setPrompt("");
  };

  const analyzeNutrients = () => {
    if (!imageBase64) return;

    submit({
      imageBase64,
      userContext: prompt,
    });

  };
  useEffect(()=>{
    console.log(object)
  },[object])

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-linear-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            AI Nutrient Analyzer
          </h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center h-64 border-dashed border-2 rounded-xl cursor-pointer">
                <Camera className="w-12 h-12 mb-4 text-emerald-500" />
                <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </label>
            ) : (
              <div className="relative inline-block group">
                <img
                  src={imagePreview}
                  className="rounded-xl"
                  alt="Preview"
                />

                <button
                  onClick={reset}
                  className="absolute top-2 right-2 bg-white text-gray-800 rounded-full p-1 shadow-md"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full mt-4 border rounded-xl p-3"
              placeholder="E.g. I am diabetic"
            />

            <button
              onClick={analyzeNutrients}
              disabled={!imageBase64 || isLoading}
              className="w-full mt-4 bg-emerald-500 text-white py-3 rounded-xl flex justify-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Analyze
            </button>
          </div>

          {/* Results */}
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 p-4 rounded-xl text-red-600">
                {error.message}
              </div>
            )}

            {object?.uiComponents?.map((item, index) => {
              if (!item || !item.component) return null;
              const Component = COMPONENT_MAP[item.component as string] as React.FC<any> | undefined;
              if (!Component) return null;

              return (
                <div key={index}>
                  <Component {...(item.props ?? {})} />
                </div>
              );
            })}

            {!object && !isLoading && (
              <div className="text-gray-400 text-center">
                Upload an image to begin
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}