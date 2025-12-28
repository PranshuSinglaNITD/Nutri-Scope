import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { imageBase64, userContext } = await req.json();

  const result = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: z.object({
      uiComponents: z.array(
        z.object({
          component: z.enum(['RiskCard', 'NutrientTable', 'SafetyBadge', 'ScienceExplainer']),
          props: z.any(), // Allows dynamic props for each component
        })
      ),
    }),
    messages: [
      {
        role: 'system',
        content: `You are an AI-Native Food Copilot. 
        Your Goal: Help users make instant health decisions without cognitive load.
        
        INSTRUCTIONS:
        1. Analyze the food image and user context (e.g., "I am diabetic").
        2. DECIDE which UI components best explain the situation.
        3. If there is a danger (e.g., High Sugar for diabetic), return a 'RiskCard' FIRST.
        4. If the user needs data, return 'NutrientTable'.
        5. Always prioritize "Reasoning" over raw data. Explain WHY.`
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