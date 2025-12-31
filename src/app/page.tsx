"use client";

import { useEffect, useState, useRef } from "react";
import { experimental_useObject as useObject } from "@ai-sdk/react"; // Ensure correct import for your SDK version
import { object, z } from "zod";
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
import {NutritionScore} from "@/components/NutritionScore";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DosAndDontsGrid } from "@/components/DosAndDontsGrid";
import { MethodologyStepper } from "@/components/MethodologyStepper";
import { QuickVerdict } from "@/components/QuickVerdict";

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
  SmartFollowUp,
  DosAndDontsGrid,
  MethodologyStepper,
  QuickVerdict,
  NutritionScore
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

  useEffect(()=>{
    console.log(object)
  },[object])

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
  // const computeNutritionScore = (components: any[] = []) => {
  //   let score = 100;
  //   const tips: string[] = [];
  //   for (const c of components) {
  //     if (!c || !c.component || !c.props) continue;
  //     const { component, props } = c;
  //     if (component === 'MacroDistribution') {
  //       const carbs = Number(props?.carbs ?? 0);
  //       const protein = Number(props?.protein ?? 0);
  //       const fat = Number(props?.fat ?? 0);
  //       const total = carbs + protein + fat || 1;
  //       const carbsPct = (carbs / total) * 100;
  //       if (carbsPct > 60) {
  //         score -= 20;
  //         tips.push('High carbohydrate ratio — consider lower-carb alternatives.');
  //       }
  //       if (protein < 10) {
  //         score -= 10;
  //         tips.push('Low protein — add a lean protein source.');
  //       }
  //     }
  //     if (component === 'ProcessingMeter') {
  //       const level = Number(props?.level ?? 1);
  //       if (level >= 4) {
  //         score -= 30;
  //         tips.push('Ultra-processed ingredients detected — limit frequency.');
  //       } else if (level === 3) {
  //         score -= 10;
  //         tips.push('Moderately processed — prefer fresher alternatives when possible.');
  //       }
  //     }
  //     if (component === 'IngredientTable' && Array.isArray(props.items)) {
  //       const bad = props.items.filter((it: any) => it?.status === 'bad');
  //       if (bad.length) {
  //         score -= Math.min(30, bad.length * 8);
  //         tips.push(`Contains concerning ingredients: ${bad.map((b: any) => b.label || b).slice(0,3).join(', ')}.`);
  //       }
  //     }
  //     if (component === 'WarningCard') {
  //       score -= 15;
  //       tips.push(props?.reasoning || 'Warning flagged by AI.');
  //     }
  //     if (component === 'ComparisonCard' && props?.sentiment === 'negative') {
  //       score -= 8;
  //       tips.push(`Compared unfavorably for ${props?.nutrient || 'a key nutrient'}.`);
  //     }
  //   }

  //   score = Math.max(0, Math.min(100, score));
  //   // If AI or our detection indicates a warning/concern, force score under 50
  //   const hasWarningCard = components.some((c) => c?.component === 'WarningCard');
  //   const detectConcerns = () => {
  //     for (const c of components) {
  //       if (!c || !c.component || !c.props) continue;
  //       if (c.component === 'IngredientTable' && Array.isArray(c.props.items)) {
  //         if (c.props.items.some((it: any) => it?.status === 'bad')) return true;
  //       }
  //       if (c.component === 'ProcessingMeter' && Number(c.props?.level) >= 4) return true;
  //       if (c.component === 'MacroDistribution') {
  //         const carbs = Number(c.props?.carbs ?? 0);
  //         const protein = Number(c.props?.protein ?? 0);
  //         const fat = Number(c.props?.fat ?? 0);
  //         const total = carbs + protein + fat || 1;
  //         const carbsPct = (carbs / total) * 100;
  //         if (carbsPct > 55) return true;
  //       }
  //     }
  //     return false;
  //   };

  //   if (hasWarningCard || detectConcerns()) {
  //     score = Math.min(score, 49);
  //   }

  //   return { score, tips };
  // };

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
    <div className="flex flex-col h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
  
      {/* -----------------------------------------------------------------
          1. HEADER (Compact & Fixed Top)
          ----------------------------------------------------------------- */}
      <header className="shrink-0 pt-4 pb-2 px-6 text-center z-20 bg-emerald-50/50 backdrop-blur-sm">
        <div className="absolute top-4 right-4">
          <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-full w-8 h-8">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase mb-2">
          <Sparkles size={10} /> AI-Powered Nutritionist
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-emerald-600 to-teal-600">
          AI Nutrient Analyzer
        </h1>
      </header>

      {/* -----------------------------------------------------------------
          2. MESSAGES AREA (Flexible Middle - Scrollable)
          ----------------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6 pb-4">
          
          {/* Empty State */}
          {chatHistory.length === 0 && !object && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 mt-20">
              <div className="bg-white/50 p-6 rounded-full mb-4">
                <Bot size={48} className="text-emerald-200" />
              </div>
              <p className="font-medium">Upload a food label or ask a question to start.</p>
            </div>
          )}

          {/* History Loop */}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* AI Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Sparkles size={14} className="text-white" />
                </div>
              )}

              <div className={`max-w-[85%] lg:max-w-[75%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                
                {/* User Image Thumbnail */}
                {msg.role === 'user' && msg.image && (
                  <img src={msg.image} alt="User upload" className="w-40 h-auto rounded-2xl border-2 border-white shadow-sm" />
                )}
                
                {/* User Text */}
                {msg.role === 'user' && msg.content && (
                  <div className="bg-gray-800 text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm shadow-md">
                    {msg.content}
                  </div>
                )}

                {/* AI Response (Components) */}
                {msg.role === 'assistant' && Array.isArray(msg.content) && (
                  <div className="space-y-3 w-full">
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

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                  <User size={14} className="text-gray-500" />
                </div>
              )}
            </div>
          ))}

          {/* Active Streaming Response */}
          {object?.uiComponents && (
            <div className="flex gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1">
                <Loader2 size={14} className="text-emerald-600 animate-spin" />
              </div>
              <div className="max-w-[85%] lg:max-w-[75%] space-y-3 w-full">
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

          {/* Error Toast */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-sm mx-auto max-w-sm">
              Unable to complete analysis. Please try again.
            </div>
          )}
        </div>
      </main>

      {/* -----------------------------------------------------------------
          3. INPUT AREA (Fixed Bottom - ~20% Height)
          ----------------------------------------------------------------- */}
      <footer className="shrink-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 h-[20vh] min-h-[160px] flex flex-col justify-center">
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col gap-3">
          
          {/* Row 1: Image Preview (if active) OR Context Hints */}
          <div className="flex-1 min-h-0 relative">
            {imagePreview ? (
              <div className="h-full w-fit relative group rounded-xl overflow-hidden border border-emerald-100 shadow-sm mx-auto md:mx-0">
                <img src={imagePreview} className="h-full w-auto object-cover" alt="Preview" />
                <button onClick={resetInput} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-emerald-100 rounded-xl bg-emerald-50/30 text-emerald-400 text-xs font-medium cursor-pointer hover:bg-emerald-50 transition-colors" onClick={() => document.getElementById('file-upload')?.click()}>
                <span className="flex items-center gap-2"><Camera size={16} /> Optional: Tap to attach food label</span>
              </div>
            )}
          </div>

          {/* Row 2: Input Bar */}
          <div className="flex gap-2 items-end">
            {/* Hidden File Input Triggered by Button */}
            <input id="file-upload" type="file" accept="image/*" hidden onChange={handleImageUpload} />
            
            <button 
              onClick={() => document.getElementById('file-upload')?.click()}
              className="p-3 rounded-xl bg-gray-100 text-gray-500 hover:bg-emerald-100 hover:text-emerald-600 transition-colors shrink-0"
              title="Upload Image"
            >
              <Camera size={20} />
            </button>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); analyzeNutrients(); }}}
              className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-all"
              placeholder="Ask a question or explain the image..."
              rows={1}
              style={{ minHeight: '46px', maxHeight: '80px' }}
            />

            <button
              onClick={analyzeNutrients}
              disabled={(!imageBase64 && !prompt) || isLoading}
              className="p-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none shrink-0"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}