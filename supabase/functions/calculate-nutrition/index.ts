import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, foodDescription, ingredients, portions, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

Calculate:
1. Total nutrition for whole recipe
2. Nutrition per 1 portion
3. Nutrition per 100g

Return ONLY JSON:
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
2. Determine weight/volume
3. Look up precise nutritional data (use USDA, official labels, food databases)
4. Calculate for given amount

Return ONLY JSON:
{
  "food_name": "food name in ${lang}",
  "identified_amount": "200g",
  "calories": 0,
  "protein": 0,
  "fat": 0,
  "carbs": 0,
  "fiber": 0,
  "sugar": 0,
  "sodium": 0,
  "per_100g": { "calories": 0, "protein": 0, "fat": 0, "carbs": 0 },
  "ingredients_breakdown": [
    { "name": "item", "amount": "200g", "calories": 0, "protein": 0, "fat": 0, "carbs": 0 }
  ],
  "confidence": "high",
  "data_source": "USDA Food Database",
  "note": "any relevant note in ${lang}"
}`;
    }

    const systemPrompt = `You are a world-class nutritionist with access to USDA food database, European food composition tables, and official product labels for branded items.
Always give precise data based on real nutritional databases.
Respond in ${lang}.
Return ONLY valid JSON. No text outside JSON. No asterisks. No markdown.`;

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";

    let result = {};
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", e, "Raw:", text.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse nutrition data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
