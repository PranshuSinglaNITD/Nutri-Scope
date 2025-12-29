import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const schema = z.object({
  uiComponents: z.array(
    z.object({
      component: z.string(),
      props: z.any(),
    })
  ),
});

export async function POST(req: Request) {
  const { imageBase64, userContext } = await req.json();

  const result = await generateObject({
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
        3. FOLLOW the props defintaion of each component defined below.
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
        `
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Context: ${userContext || 'General health check'}` },
          { type: 'image', image: imageBase64 }
        ]
      }
    ],
  });

  return result.toJsonResponse();
}