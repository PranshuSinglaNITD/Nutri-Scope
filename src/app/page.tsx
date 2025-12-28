"use client";
import { useState } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react'
import { RiskCard ,NutrientTable, SafetyBadge } from '@/components/dumbComponents';
import { z } from 'zod';

// 1. The Mapping Registry
const COMPONENT_MAP: Record<string, React.FC<any>> = {
  RiskCard: RiskCard,
  NutrientTable: NutrientTable,
  SafetyBadge: SafetyBadge,
};

// 2. Define Schema for TypeScript Safety (Optional but recommended)
const analysisSchema = z.object({
  uiComponents: z.array(z.object({
    component: z.string(),
    props: z.any()
  }))
});

export default function Home() {
  const { object, submit, isLoading } = useObject({
    api: '/api/ai-response',
    schema: analysisSchema,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for the API
    const reader = new FileReader();
    reader.onload = () => {
      submit({ 
        imageBase64: reader.result as string,
        userContext: "I am trying to avoid sugar." // Example context
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🥗 Food Copilot</h1>
        <p className="text-gray-500 text-sm">AI-Native Health Scanner</p>
      </header>

      {/* Input Area */}
      <div className="mb-8">
        <label className="block w-full cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
          <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
          <span className="text-gray-600 font-medium">📸 Tap to Scan Food</span>
        </label>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
            <span className="text-xs text-gray-400">Analyzing ingredients...</span>
          </div>
        </div>
      )}

      {/* GENERATIVE UI RENDERING LOOP */}
      <div className="space-y-4">
        {object?.uiComponents?.map((item, index) => {
          const Component = COMPONENT_MAP[item.component];
          if (!Component) return null; // Graceful fallback
          
          return (
            <div key={index} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Component {...item.props} />
            </div>
          );
        })}
      </div>
    </div>
  );
}