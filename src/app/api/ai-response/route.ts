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

  const { imageBase64, userContext } = parsed.data;

  // Read API key from environment. Prefer `GOOGLE_API_KEY`, fallback to `GENAI_API_KEY`.
  const apiKey = process.env.GOOGLE_API_KEY ?? process.env.GENAI_API_KEY ?? process.env.GENERATIVE_AI_API_KEY;

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
        3. FOLLOW the props definition of each component defined below.
        4. If there is a danger (e.g., High Sugar for diabetic), return a 'RiskCard' FIRST.
        5. If the user needs data, return 'NutrientTable'.
        6. Always prioritize "Reasoning" over raw data. Explain WHY.
        
        CRITICAL OUTPUT RULES:
        You must ONLY return a JSON object with a 'uiComponents' array.
        Each item in the array MUST follow this exact structure:
        {
          "component": "RiskCard" | "NutrientTable" | "SafetyBadge",
          "props": { ...specific props for that component... }
        }

        COMPONENT DEFINITIONS:
        1. Use 'RiskCard' if the food contains allergens, high sugar, or unhealthy ingredients.
            Props: { title: string, severity: "high"|"medium", reasoning: string, source?: string }
        
        2. Use 'NutrientTable' to show data.
            Props: { items: [{ label: string, value: string, status?: "good"|"bad" }] }
        
        3. Use 'SafetyBadge' if the food is safe/healthy.
            Props: { message: string }

        Do NOT invent new component types like "productCard".
        Do NOT output flat JSON. Use the nested 'props' structure.
        `,
        },
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