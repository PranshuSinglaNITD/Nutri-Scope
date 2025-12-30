import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Output schema (what we expect the AI to return)
const schema = z.object({
  uiComponents: z.array(
    z.object({
      component: z.string(),
      props: z.any(),
    })
  ),
});

// Basic input validation for the HTTP request body
const inputSchema = z.object({
  imageBase64: z.string().min(16).optional(),
  userContext: z.string().optional(),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string() // We pass text history to save tokens/complexity
    })
  ).optional().default([]),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const { imageBase64, userContext ,history} = parsed.data;

  // Read API key from environment. Prefer `GOOGLE_API_KEY`, fallback to `GENAI_API_KEY`.
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing Google API key. Set GOOGLE_API_KEY in .env.local' }),
      { status: 500, headers: { 'content-type': 'application/json; charset=utf-8' } }
    );
  }

  try {
    const result = await generateObject({
      // pass provider-specific options so the SDK can authenticate
      model: google('gemini-2.5-flash'),
      providerOptions: ({ apiKey } as any),
      schema,
      messages: [
        {
          role: 'system',
          content: `You are an AI-Native Food Copilot. 
            Your Goal: Help users make instant health decisions without cognitive load.

            INSTRUCTIONS:
            1. Analyze the food image and user context (e.g., "I am diabetic").
            2. DECIDE which UI components best explain the situation.
            3. FOLLOW the props definition of each component defined below strictly.
            4. If there is a danger (e.g., High Sugar for diabetic), return a 'WarningCard' FIRST.
            5. If the user needs data, return 'IngredientTable'.
            6. Always prioritize "Reasoning" over raw data. Explain WHY.

            CRITICAL OUTPUT RULES:
            You must ONLY return a JSON object with a 'uiComponents' array.
            Each item in the array MUST follow this exact structure:
            {
              "component": "WarningCard" | "HealthBadge" | "IngredientTable" | "ScienceExplainer" | "AlternativeSuggestionCard" | "ProcessingMeter" | "MacroDistribution" | "SmartFollowUp",
              "props": { ...specific props for that component... }
            }

            COMPONENT DEFINITIONS:
            1. Use 'WarningCard' if the food contains allergens, conflicts with the user's stated diet (e.g., Non-Halal, Non-Vegan, Diabetic), or has objectively unhealthy attributes (e.g., "High Fructose Corn Syrup", "Trans Fats").
              Props: { title: string, severity: 'low' | 'medium' | 'high', reasoning: string, source: string }

            2. Use 'HealthBadge' to provide quick, positive confirmation when the product aligns with user goals or is safe to consume (e.g., "Keto Friendly", "Safe for Peanut Allergy", "100% Clean Label").
              Props: { message: string, variant: 'success' | 'info'}

            3. Use 'IngredientTable' to breakdown the Macro-nutrients or to list specific additives found in the text or image. Do not list every ingredient; filter for the most impactful ones (Sugar, Protein, Sodium, or additives).
              Props : { items : ["{ label: string; value: string; status: 'good' | 'bad' }"]

            4. Use 'ScienceExplainer' to educate the user about complex chemical names (e.g., "Carrageenan", "Red 40") or to explain the metabolic impact of the food. Use this when the user needs to understand *why* an ingredient is flagged.
              Props : { title : string, explaination : string}

            5. Use 'AlternativeSuggestionCard' ONLY when the main verdict is negative (WarningCard is present). Suggest 1-3 healthier alternatives that satisfy the same craving or product category.
              Props : { suggestions : ["{title: string; reason: string; link: string}"]

            6.Use Case 'ProcessingMeter' : Modern health advice focuses heavily on "Ultra-processed" foods. This component visualizes how natural or artificial the food is (NOVA classification), which is different from just checking sugar levels
              Props : { level: 1 | 2 | 3 | 4, title : string, description : string}

            7.Use Case 'MacroDistribution' : Tables are boring. Use this to show the ratio of macros (Carbs vs Protein vs Fat) visually. Great for Gym-goers or Keto users.
              Props : { carbs : number, protein : number, fat : number, calories : number}

            8.Use Case 'SmartFollowUp': This is crucial for "AI-Native" apps. Instead of leaving the user hanging, anticipate their next question. "Is this keto?", "Why is Red 40 bad?".
              Props : {questions : string[], onSelect: (question: string) => void }

            9.Use Case 'ComparisonCard': Numbers are abstract. "20g Sugar" is confusing. "Equivalent to 5 sugar cubes" or "30% less than a Snickers" provides instant context.
              Props : {nutrient: string, currentValue: string, comparisonText: string, sentiment: 'positive' | 'negative' | 'neutral'}
            
            Do NOT invent new component types like "productCard".
            Do NOT output flat JSON. Use the nested 'props' structure.
            If the image is blurry or text is unreadable, use 'ScienceExplainer' to ask the user to retake the photo.`
        },
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user',
          content: [
            { type: 'text', text: `Context: ${userContext || 'General health check'}` },
            ...(imageBase64 ? ([{ type: 'image', image: imageBase64 as string }] as any) : []),
          ]
        }
      ],
    });

    return result.toJsonResponse();
  } catch (err: any) {
    console.error('AI generateObject error:', err);
    return new Response(JSON.stringify({ error: err?.message ?? 'Internal error' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
}