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
import NutritionScore from "@/components/NutritionScore";
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

  // Simple ErrorBoundary to prevent a single broken card from crashing the whole feed
  class ErrorBoundary extends (require('react').Component as any) {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
      return { hasError: true };
    }
    componentDidCatch(error: any, info: any) {
      console.error('Component render error:', error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
            Failed to render a card.
          </div>
        );
      }
      return this.props.children;
    }
  }

  // If the AI omitted a WarningCard but other cards indicate risk, synthesize one
    const synthesizeWarningIfNeeded = (components: any[] = []) => {
      if (!Array.isArray(components)) return components;

      const detectIssues = (comps: any[]) => {
        const issues: string[] = [];
        for (const c of comps) {
          if (!c || !c.component || !c.props) continue;
          const { component, props } = c;
          if (component === 'IngredientTable' && Array.isArray(props.items)) {
            const bad = props.items.filter((it: any) => it?.status === 'bad');
            if (bad.length) issues.push(...bad.map((b: any) => b.label || b));
          }
          if (component === 'MacroDistribution') {
            const carbs = Number(props?.carbs ?? 0);
            const protein = Number(props?.protein ?? 0);
            const fat = Number(props?.fat ?? 0);
            const total = carbs + protein + fat || 1;
            const carbsPct = (carbs / total) * 100;
            if (carbsPct > 55) issues.push('High carbohydrate ratio');
          }
          if (component === 'ProcessingMeter' && Number(props?.level) >= 4) {
            issues.push('Ultra-processed (NOVA 4)');
          }
          if (component === 'ComparisonCard' && props?.sentiment === 'negative') {
            issues.push(props?.nutrient || 'Unfavorable comparison');
          }
          // detect sodium text in props
          if (component === 'IngredientTable' && Array.isArray(props.items)) {
            const salty = props.items.filter((it: any) => /sodium|salt/i.test(it?.label || ''));
            if (salty.length) issues.push('High sodium');
          }
        }
        return Array.from(new Set(issues));
      };

      const hasWarning = components.some((c) => c?.component === 'WarningCard');
      const issues = detectIssues(components);

      if (!hasWarning && issues.length === 0) return components;

      // build warning
      const reasoning = issues.length > 0 ? `Detected potential concerns: ${issues.slice(0,3).join(', ')}.` : 'Potential health concerns detected.';
      const warning = {
        component: 'WarningCard',
        props: {
          title: 'Potential Health Concerns',
          severity: 'high',
          reasoning,
          source: 'Auto-checker',
        },
      };

      // Remove any HealthBadge so tick icon does not appear for concerning foods
      const withoutBadge = components.filter((c) => c?.component !== 'HealthBadge');

      // Ensure alternatives exist
      const hasAlternative = components.some((c) => c?.component === 'AlternativeSuggestionCard');
      const altSuggestions: string[] = [];
        if (issues.some(i => /carbohydrate|carb/i.test(i))) {
          altSuggestions.push(JSON.stringify({ title: 'Whole-grain or vegetable noodles', reason: 'Lower refined carbs and higher fiber' }));
          altSuggestions.push(JSON.stringify({ title: 'Spiralized zucchini or shirataki noodles', reason: 'Very low-carb noodle alternatives' }));
          altSuggestions.push(JSON.stringify({ title: 'Half-portion of noodles + extra veggies', reason: 'Reduce carbs while keeping volume' }));
        }
        if (issues.some(i => /sodium|salt|High sodium/i.test(i))) {
          altSuggestions.push(JSON.stringify({ title: 'Make a low-sodium sauce', reason: 'Reduces overall sodium while preserving flavor' }));
          altSuggestions.push(JSON.stringify({ title: 'Use fresh herbs and citrus instead of salt', reason: 'Boosts flavor without sodium' }));
        }
        if (issues.some(i => /Ultra-processed|NOVA 4/i.test(i))) {
          altSuggestions.push(JSON.stringify({ title: 'Homemade stir-fry with fresh ingredients', reason: 'Minimizes ultra-processed components' }));
          altSuggestions.push(JSON.stringify({ title: 'Use minimally processed proteins (tofu, chicken breast)', reason: 'Lower additives and preservatives' }));
        }
        // Add general healthy swaps if none specific
        if (altSuggestions.length === 0) {
          altSuggestions.push(JSON.stringify({ title: 'Grilled lean protein option', reason: 'Lower in saturated fat and calories' }));
          altSuggestions.push(JSON.stringify({ title: 'Increase vegetables or side salad', reason: 'Adds fiber and micronutrients' }));
          altSuggestions.push(JSON.stringify({ title: 'Swap sugary drinks for water or herbal tea', reason: 'Reduces added sugars and calories' }));
        }

      const altCard = {
        component: 'AlternativeSuggestionCard',
        props: {
          suggestions: altSuggestions,
        },
      };

      if (!hasAlternative) {
        return [warning, altCard, ...withoutBadge];
      }

      // If warning already present, still remove HealthBadge and keep order
      return [warning, ...withoutBadge];
    };

  // Compute a quick heuristic nutrition score from the AI components
  const computeNutritionScore = (components: any[] = []) => {
    let score = 100;
    const tips: string[] = [];
    for (const c of components) {
      if (!c || !c.component || !c.props) continue;
      const { component, props } = c;
      if (component === 'MacroDistribution') {
        const carbs = Number(props?.carbs ?? 0);
        const protein = Number(props?.protein ?? 0);
        const fat = Number(props?.fat ?? 0);
        const total = carbs + protein + fat || 1;
        const carbsPct = (carbs / total) * 100;
        if (carbsPct > 60) {
          score -= 20;
          tips.push('High carbohydrate ratio — consider lower-carb alternatives.');
        }
        if (protein < 10) {
          score -= 10;
          tips.push('Low protein — add a lean protein source.');
        }
      }
      if (component === 'ProcessingMeter') {
        const level = Number(props?.level ?? 1);
        if (level >= 4) {
          score -= 30;
          tips.push('Ultra-processed ingredients detected — limit frequency.');
        } else if (level === 3) {
          score -= 10;
          tips.push('Moderately processed — prefer fresher alternatives when possible.');
        }
      }
      if (component === 'IngredientTable' && Array.isArray(props.items)) {
        const bad = props.items.filter((it: any) => it?.status === 'bad');
        if (bad.length) {
          score -= Math.min(30, bad.length * 8);
          tips.push(`Contains concerning ingredients: ${bad.map((b: any) => b.label || b).slice(0,3).join(', ')}.`);
        }
      }
      if (component === 'WarningCard') {
        score -= 15;
        tips.push(props?.reasoning || 'Warning flagged by AI.');
      }
      if (component === 'ComparisonCard' && props?.sentiment === 'negative') {
        score -= 8;
        tips.push(`Compared unfavorably for ${props?.nutrient || 'a key nutrient'}.`);
      }
    }

    score = Math.max(0, Math.min(100, score));
    // If AI or our detection indicates a warning/concern, force score under 50
    const hasWarningCard = components.some((c) => c?.component === 'WarningCard');
    const detectConcerns = () => {
      for (const c of components) {
        if (!c || !c.component || !c.props) continue;
        if (c.component === 'IngredientTable' && Array.isArray(c.props.items)) {
          if (c.props.items.some((it: any) => it?.status === 'bad')) return true;
        }
        if (c.component === 'ProcessingMeter' && Number(c.props?.level) >= 4) return true;
        if (c.component === 'MacroDistribution') {
          const carbs = Number(c.props?.carbs ?? 0);
          const protein = Number(c.props?.protein ?? 0);
          const fat = Number(c.props?.fat ?? 0);
          const total = carbs + protein + fat || 1;
          const carbsPct = (carbs / total) * 100;
          if (carbsPct > 55) return true;
        }
      }
      return false;
    };

    if (hasWarningCard || detectConcerns()) {
      score = Math.min(score, 49);
    }

    return { score, tips };
  };

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

  // Handle follow-up question selections from SmartFollowUp buttons
  const handleFollowUpSelect = (question: string) => {
    // Use same flow as analyzeNutrients but for a text-only follow-up
    const updatedHistory = [...chatHistory];

    if (object?.uiComponents) {
      updatedHistory.push({ role: 'assistant', content: object.uiComponents });
    }

    updatedHistory.push({ role: 'user', content: question });
    setChatHistory(updatedHistory);

    const apiHistory = updatedHistory.map(msg => {
      if (msg.role === 'user') return { role: 'user', content: msg.content };
      return { role: 'assistant', content: JSON.stringify(msg.content) };
    });

    submit({ userContext: question, history: apiHistory });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
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
            <h1 className="text-4xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-emerald-600 to-teal-600">
                AI Nutrient Analyzer
            </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 h-200">
          
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
                    className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white/50 text-black"
                    placeholder="E.g. Is this safe for a diabetic?"
                    rows={3}
                  />
              </div>

              {/* Action Button */}
              <button
                onClick={analyzeNutrients}
                disabled={(!imageBase64 && !prompt) || isLoading}
                className="w-full mt-4 bg-linear-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 cursor-pointer"
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
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
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
                                {synthesizeWarningIfNeeded(msg.content).map((item: any, idx: number) => {
                                  const Component = COMPONENT_MAP[item.component];
                                  const extraProps = item.component === 'SmartFollowUp' ? { onSelect: handleFollowUpSelect } : {};
                                  return Component ? (
                                    <ErrorBoundary key={idx}>
                                      <Component {...item.props} {...extraProps} />
                                    </ErrorBoundary>
                                  ) : null;
                                })}
                              </div>
                            )}
                        </div>

                        {/* User Avatar (Right) */}
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                                <User size={14} className="text-gray-500" />
                            </div>
                        )}
                    </div>
                ))}

                {/* 2. Render Current Streaming Response (Active) */}
                {object?.uiComponents && (
                     <div className="flex gap-4 justify-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                            <Loader2 size={14} className="text-emerald-600 animate-spin" />
                        </div>
                        <div className="max-w-[85%] space-y-4 w-full">
                            {/* Nutrition score (computed client-side for quick feedback) */}
                            {(() => {
                              try {
                                const { score, tips } = computeNutritionScore(object.uiComponents || []);
                                return (
                                  <ErrorBoundary key="nutrition-score">
                                    <NutritionScore score={score} tips={tips} />
                                  </ErrorBoundary>
                                );
                              } catch (e) {
                                return null;
                              }
                            })()}

                            {synthesizeWarningIfNeeded(object.uiComponents).map((item, index) => {
                              const Component = COMPONENT_MAP[item.component];
                              const extraProps = item.component === 'SmartFollowUp' ? { onSelect: handleFollowUpSelect } : {};
                              return Component ? (
                                <ErrorBoundary key={index}>
                                  <Component {...item.props} {...extraProps} />
                                </ErrorBoundary>
                              ) : null;
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