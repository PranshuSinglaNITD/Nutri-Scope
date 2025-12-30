"use client";

import { useEffect, useState, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react"; // Ensure correct import for your SDK version
import { z } from "zod";
import { Camera, Loader2, Moon, Sparkles, Sun, X, User, Bot } from "lucide-react";
import WarningCard from "@/components/WarningCard";
import IngredientTable from "@/components/IngredientTable";
import HealthBadge from "@/components/HealthBadge";
import ScienceExplainer from "@/components/ScienceExplainer";
import AlternativeSuggestionCard from "@/components/AlternativeSuggestionCard";
import { ComparisonCard } from "@/components/ComparisonCard";
import { MacroDistribution } from "@/components/MacroDistribution";
import { ProcessingMeter } from "@/components/ProcessingMeter";
import { SmartFollowUp } from "@/components/SmartFollowUp";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

// 1️⃣ Component Registry
const COMPONENT_MAP: Record<string, React.FC<any>> = {
  WarningCard,
  IngredientTable,
  HealthBadge,
  ScienceExplainer,
  AlternativeSuggestionCard,
  ComparisonCard,
  MacroDistribution,
  ProcessingMeter,
  SmartFollowUp
};

// 2️⃣ Schema
const analysisSchema = z.object({
  uiComponents: z.array(
    z.object({
      component: z.string(),
      props: z.any(),
    })
  ),
});

// 3️⃣ Types for Chat History
type ChatItem = {
  role: 'user' | 'assistant';
  content: any;
  image?: string | null; // Store base64 preview for UI
};

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const { setTheme, theme } = useTheme();
  
  // New State for History
  const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { object, submit, isLoading, error } = useObject({
    api: "/api/ai-response",
    schema: analysisSchema,
  });

  // Auto-scroll to bottom when chat updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, object]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      setImageBase64(base64.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const resetInput = () => {
    setImagePreview(null);
    setImageBase64(null);
    setPrompt("");
  };

  const analyzeNutrients = () => {
    // 1. Capture current input values
    const currentPrompt = prompt;
    const currentImageRaw = imageBase64;
    const currentImageView = imagePreview;

    if (!currentImageRaw && !currentPrompt) return;

    // 2. Archive the PREVIOUS turn (if exists) into history
    let updatedHistory = [...chatHistory];
    
    // If there is a completed object from the *last* turn, save it now
    if (object?.uiComponents) {
       updatedHistory.push({
         role: 'assistant',
         content: object.uiComponents
       });
    }

    // 3. Add the NEW User message to history (Optimistic UI)
    updatedHistory.push({
      role: 'user',
      content: currentPrompt || "Analyze this image",
      image: currentImageView
    });

    setChatHistory(updatedHistory);

    // 4. Prepare History for API (Text only to save bandwidth/tokens)
    const apiHistory = updatedHistory.map(msg => {
      if (msg.role === 'user') {
        return { role: 'user', content: msg.content };
      } else {
        // Stringify UI components so AI knows what it previously showed
        return { role: 'assistant', content: JSON.stringify(msg.content) };
      }
    });

    // 5. Submit to backend
    submit({
      imageBase64: currentImageRaw, // Send current image if present
      userContext: currentPrompt,
      history: apiHistory
    });

    // Optional: Clear text input after send (feel free to remove this if you prefer)
    setPrompt(""); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header (Your styled header) */}
        <div className="relative w-full max-w-5xl mx-auto pt-6 pb-12 px-6 text-center">
            <div className="absolute top-6 right-6">
                <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full">
                    {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase mb-4">
                <Sparkles size={12} /> AI-Powered Nutritionist
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                AI Nutrient Analyzer
            </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 h-[800px]">
          
          {/* LEFT COLUMN: Input Controls (Sticky) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-white/50 h-full flex flex-col">
               <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                 <Camera className="text-emerald-500" /> New Analysis
               </h2>
               
               {/* Upload Area */}
               {!imagePreview ? (
                <label className="flex-1 flex flex-col items-center justify-center border-3 border-dashed border-emerald-100 rounded-2xl cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <Camera className="w-12 h-12 mb-3 text-emerald-300" />
                  <span className="text-sm text-gray-400 font-medium">Tap to upload food label</span>
                  <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                </label>
              ) : (
                <div className="relative group rounded-2xl overflow-hidden border border-emerald-100 shadow-sm">
                  <img src={imagePreview} className="w-full h-48 object-cover" alt="Preview" />
                  <button onClick={resetInput} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Text Input */}
              <div className="mt-4">
                  <label className="text-xs font-bold text-gray-500 uppercase ml-1">Context / Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white/50"
                    placeholder="E.g. Is this safe for a diabetic?"
                    rows={3}
                  />
              </div>

              {/* Action Button */}
              <button
                onClick={analyzeNutrients}
                disabled={(!imageBase64 && !prompt) || isLoading}
                className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {isLoading ? "Analyzing..." : "Ask AI Copilot"}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Conversation Feed */}
          <div className="lg:col-span-8 bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden flex flex-col">
            
            {/* Scrollable Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth" ref={scrollRef}>
                
                {chatHistory.length === 0 && !object && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                        <Bot size={48} className="mb-4" />
                        <p>No analysis yet. Upload a photo to start.</p>
                    </div>
                )}

                {/* 1. Render History */}
                {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        
                        {/* AI Avatar (Left) */}
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                                <Sparkles size={14} className="text-emerald-600" />
                            </div>
                        )}

                        <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                            
                            {/* User: Image Thumbnail */}
                            {msg.role === 'user' && msg.image && (
                                <img src={msg.image} alt="User upload" className="w-32 h-32 rounded-lg object-cover border-2 border-white shadow-sm" />
                            )}
                            
                            {/* User: Text Bubble */}
                            {msg.role === 'user' && msg.content && (
                                <div className="bg-gray-800 text-white px-4 py-2 rounded-2xl rounded-tr-none text-sm shadow-md">
                                    {msg.content}
                                </div>
                            )}

                            {/* AI: Component Stack */}
                            {msg.role === 'assistant' && Array.isArray(msg.content) && (
                                <div className="space-y-4 w-full">
                                    {msg.content.map((item: any, idx: number) => {
                                        const Component = COMPONENT_MAP[item.component];
                                        return Component ? <Component key={idx} {...item.props} /> : null;
                                    })}
                                </div>
                            )}
                        </div>

                        {/* User Avatar (Right) */}
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                                <User size={14} className="text-gray-500" />
                            </div>
                        )}
                    </div>
                ))}

                {/* 2. Render Current Streaming Response (Active) */}
                {object?.uiComponents && (
                     <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                            <Loader2 size={14} className="text-emerald-600 animate-spin" />
                        </div>
                        <div className="max-w-[85%] space-y-4 w-full">
                            {object.uiComponents.map((item, index) => {
                                const Component = COMPONENT_MAP[item.component];
                                return Component ? <Component key={index} {...item.props} /> : null;
                            })}
                        </div>
                     </div>
                )}
                
                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-sm">
                        Unable to complete analysis. Please try again.
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}