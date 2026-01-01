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
      content: z.any() // accept string or structured assistant objects
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

  const { imageBase64, userContext, history } = parsed.data;

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
              "component": "WarningCard" | "HealthBadge" | "IngredientTable" | "ScienceExplainer" | "AlternativeSuggestionCard" | "ProcessingMeter" | "MacroDistribution" | "SmartFollowUp" | "ComparisonCard" | "QuickVerdict" | "DosAndDontsGrid" | "MethodologyStepper" | "NutritionScore" | "EvidenceSources" | "LongTermImpactCard",
              "props": { ...specific props for that component... }
            }

            COMPONENT DEFINITIONS:
            1. Use 'WarningCard' if the food contains allergens, conflicts with the user's stated diet (e.g., Non-Halal, Non-Vegan, Diabetic), or has objectively unhealthy attributes (e.g., "High Fructose Corn Syrup", "Trans Fats").
              Props: { title: string, severity: 'low' | 'medium' | 'high', reasoning: string, source: string }

            2. Use 'HealthBadge' to provide quick, positive confirmation when the product aligns with user goals or is safe to consume (e.g., "Keto Friendly", "Safe for Peanut Allergy", "100% Clean Label").
              Props: { message: string, variant: 'success' | 'info'}

            3. Use 'IngredientTable' to breakdown the Macro-nutrients or to list specific additives found in the text or image. Do not list every ingredient; filter for the most impactful ones (Sugar, Protein, Sodium, or additives).
              Props : { items : ["{ label: string; value: string; status: 'good' | 'bad' }"]

            4. Use 'ScienceExplainer' ONLY to educate the user about:
- complex chemical names (e.g., "Carrageenan", "Red 40", "Acrylamide")
- biological or metabolic effects of food processing (e.g., deep-frying, ultra-processing)

DO NOT use ScienceExplainer for:
- general advice
- short warnings
- step-by-step instructions
- lists or bullet points

Props MUST follow this EXACT structure:
Props: {
  title: string,            // clear, specific topic
  explaination: string      // a single normal paragraph (plain text)
}

STRICT RULES:
- The explaination MUST be a single continuous paragraph (no lists, no JSON, no steps)
- The explaination MUST be at least 30 characters long
- The explaination MUST explain cause-and-effect (why something happens and why it matters)
- DO NOT render ScienceExplainer if you cannot provide meaningful educational content
- DO NOT output empty strings, placeholders, or generic statements
- DO NOT render ScienceExplainer when nested or structured props are required elsewhere (e.g., step arrays, tables, grids)
- Use ScienceExplainer ONLY when a simple paragraph explanation is sufficient

VALID EXAMPLE:

{
  "component": "ScienceExplainer",
  "props": {
    "title": "Why Deep-Frying Forms Acrylamide",
    "explaination": "When starchy foods such as potatoes are cooked at very high temperatures, a chemical reaction occurs between sugars and amino acids, producing a compound called acrylamide. Research has linked high acrylamide exposure to increased cancer risk in animal studies, which is why frequent consumption of deep-fried foods is discouraged."
  }
}

INVALID EXAMPLES (DO NOT OUTPUT):

 explaination: ""
 explaination: "Frying is unhealthy."
 explaination: ["Point 1", "Point 2"]
 explaination: { "step": "heat oil" }
 Using ScienceExplainer when MethodologyStepper or IngredientTable is more appropriate


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

            10.Use Case 'QuickVerdict' : Answering binary questions like "Can I eat potatoes if I have diabetes?" or "Is this safe if it's not fried?"\
              Props : { status: 'safe' | 'caution' | 'avoid', title: string, explanation: string, nuanceTag: string }

            11.Use Case : 'DosAndDontsGrid' : Answering broad queries like "What other foods should I avoid with Jaundice?" or "What acts as a good substitute?"
              Props : { condition: string, recommended: ["{name : string,reason : string}"], avoid: ["{name : string,reason : string}"] }
            
            12.Use Case : 'MethodologyStepper' : Explaining processes. "How do I reduce the starch?" or "Why does frying make it unhealthy?"  
              Props : { title : string, steps : ["{action: string,detail: string,tip: string}"] }

            13.Use Case : 'NutritionScore' : Instantly visualizing the overall healthiness or suitability of a food product with a color-coded 0-100 rating and a brief summary verdict
              Props : { score : number, subtitle : string, feedback : string }
            
            Do NOT invent new component types like "productCard".
            Do NOT output flat JSON. Use the nested 'props' structure.
            If the image is blurry or text is unreadable, use 'ScienceExplainer' to ask the user to retake the photo.
            Only show the neccessary components and avoid unneccasary components
            Keep the order of components so that it make the most sense
            
           14. Use case : 'EvidenceSources'

Use this component whenever scientific, medical, or health-related claims are made.

Props MUST follow this EXACT structure.
ALL fields are REQUIRED and must be non-empty.

Props:
{
  sources: [
    {
      title: string,                 // short paper or guideline title
      authority: "WHO" | "FDA" | "ICMR" | "NIH" | "Peer-Reviewed",
      description: string,           // 1-line summary of relevance
      confidence: number             // integer between 70 and 100
    }
  ]
}

Rules:
- Include at least ONE source
- DO NOT include empty objects
- DO NOT omit any field
- Confidence must be a NUMBER (not text, not string)
- Render EvidenceSources IMMEDIATELY AFTER ScienceExplainer
- If you cannot name a real authority-backed source, DO NOT render EvidenceSources at all

VALID EXAMPLE (CORRECT):

{
  "component": "EvidenceSources",
  "props": {
    "sources": [
      {
        "title": "Ultra-processed foods and cardiometabolic risk",
        "authority": "WHO",
        "description": "WHO guidelines associate frequent consumption of ultra-processed foods with obesity and cardiovascular disease.",
        "confidence": 92
      }
    ]
  }
}

INVALID EXAMPLES (DO NOT OUTPUT):

{ "sources": [{}] }
{ "confidence": "%" }
{ "authority": "Unknown" }
Empty strings or missing fields

Include EvidenceSources whenever ScienceExplainer makes a scientific or
health-related claim AND a real authority-backed source can be named.

If a credible source cannot be confidently named, DO NOT render EvidenceSources.

dont render it when nested props are used 

15. Use case : 'LongTermImpactCard'

Use this component ONLY when repeated or long-term consumption of the food may
affect health over months or years (e.g., ultra-processed foods, high sugar,
trans fats, excess sodium).

Props MUST follow this EXACT structure:
Props: {
  title: string,            // e.g. "Long-Term Health Impact"
  impacts: [
    {
      effect: string,       // e.g. "Increased cardiovascular risk"
      explanation: string,  // 1–2 sentences explaining why
      severity: "low" | "medium" | "high"
    }
  ],
  timeframe: string         // e.g. "Over months to years"
}

STRICT RULES:
- DO NOT render if impacts array is empty
- Each explanation must be a normal paragraph (no lists, no steps)
- DO NOT render when nested or tabular components are more suitable
- Render LongTermImpactCard AFTER ScienceExplainer when both are present.
LongTermImpactCard may appear independently if long-term effects are clear.

VALID EXAMPLE:

{
  "component": "LongTermImpactCard",
  "props": {
    "title": "Long-Term Health Impact",
    "timeframe": "Over months to years",
    "impacts": [
      {
        "effect": "Higher cardiovascular disease risk",
        "explanation": "Frequent intake of fried and ultra-processed foods increases saturated fat and inflammatory markers, which are associated with heart disease over time.",
        "severity": "high"
      }
    ]
  }
}


`

        },
        ...history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
        })),
        {
          role: 'user',
          content: JSON.stringify([
            { type: 'text', text: `Context: ${userContext || 'General health check'}` },
            ...(imageBase64 ? ([{ type: 'image', image: imageBase64 as string }] as any) : []),
          ])
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