import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceAiQuota } from "../_shared/quota-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const _q = await enforceAiQuota(req, { cors: corsHeaders, requirePaid: false });
  if (!_q.ok) return _q.response;
  try {
    const body = await req.json();
    const { mode, foodDescription, ingredients, portions, language } = body;

    console.log("calculate-nutrition called:", { mode, foodDescription, language });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    let userPrompt = '';

    if (mode === 'recipe') {
      const ingredientsList = (ingredients || [])
        .map((i: any) => `${i.name}: ${i.amount}${i.unit}`)
        .join('\n');

      userPrompt = `Calculate precise nutrition for this recipe.
Ingredients:
${ingredientsList}

Total portions: ${portions || 1}

Return ONLY valid JSON (no markdown, no code blocks, no text outside JSON):
{
  "recipe_name": "dish name in ${lang}",
  "total_weight": 450,
  "per_portion_weight": 225,
  "portions": ${portions || 1},
  "total": { "calories": 0, "protein": 0, "fat": 0, "carbs": 0, "fiber": 0, "sugar": 0 },
  "per_portion": { "calories": 0, "protein": 0, "fat": 0, "carbs": 0, "fiber": 0, "sugar": 0 },
  "per_100g": { "calories": 0, "protein": 0, "fat": 0, "carbs": 0 },
  "ingredients_breakdown": [
    { "name": "ingredient", "amount": "200g", "calories": 0, "protein": 0, "fat": 0, "carbs": 0 }
  ],
  "confidence": "high",
  "data_source": "USDA nutritional database"
}`;
    } else {
      userPrompt = `Calculate precise nutrition for: "${foodDescription}"

Think step by step:
1. Identify exact product/dish
2. Determine weight/volume (if not specified, use typical serving)
3. Look up precise nutritional data
4. Calculate for given amount

Return ONLY valid JSON (no markdown, no code blocks, no text outside JSON):
{
  "food_name": "food name in ${lang}",
  "identified_amount": "200g",
  "calories": 0,
  "protein": 0,
  "fat": 0,
  "carbs": 0,
  "fiber": 0,
  "sugar": 0,
  "per_100g": { "calories": 0, "protein": 0, "fat": 0, "carbs": 0 },
  "ingredients_breakdown": [
    { "name": "item", "amount": "200g", "calories": 0, "protein": 0, "fat": 0, "carbs": 0 }
  ],
  "confidence": "high",
  "data_source": "USDA Food Database",
  "note": "note in ${lang}"
}`;
    }

    const systemPrompt = `You are a world-class nutritionist with access to USDA food database and European food composition tables.
Always give precise data based on real nutritional databases.
Respond in ${lang}.
CRITICAL: Return ONLY valid JSON. No text before or after. No markdown code blocks. No backticks. No asterisks.`;

    console.log("Calling AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    console.log("AI gateway response status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI gateway error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    console.log("AI raw response length:", rawText.length);
    console.log("AI raw response preview:", rawText.substring(0, 200));

    if (!rawText) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggressive JSON extraction
    let cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*[\r\n]+/gm, '')
      .trim();

    // Find JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", cleaned.substring(0, 300));
      return new Response(JSON.stringify({ error: "Failed to parse nutrition data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse failed:", parseErr, "Extracted:", jsonMatch[0].substring(0, 300));
      // Try to fix common issues
      const fixed = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/'/g, '"');
      try {
        result = JSON.parse(fixed);
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse nutrition data" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Successfully parsed result, calories:", result.calories || result.per_portion?.calories);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("calculate-nutrition error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
