import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const langMap: Record<string, string> = {
  en: "English", ru: "Russian", lv: "Latvian", uk: "Ukrainian",
};

function extractJSON(text: string): any {
  // Try direct parse first
  try { return JSON.parse(text); } catch {}

  // Remove markdown fences
  let cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try { return JSON.parse(cleaned); } catch {}

  // Extract JSON object from surrounding text
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
    // Try fixing truncated JSON
    let fixable = match[0];
    const opens = (fixable.match(/\{/g) || []).length;
    const closes = (fixable.match(/\}/g) || []).length;
    if (opens > closes) fixable += "}".repeat(opens - closes);
    try { return JSON.parse(fixable); } catch {}
  }

  // Regex fallback
  const calories = text.match(/"(?:total_)?calories":\s*(\d+)/)?.[1];
  const protein = text.match(/"protein":\s*([\d.]+)/)?.[1];
  const fat = text.match(/"fat":\s*([\d.]+)/)?.[1];
  const carbs = text.match(/"carbs":\s*([\d.]+)/)?.[1];
  if (calories) {
    return {
      total_calories: parseInt(calories),
      protein: parseFloat(protein || "10"),
      fat: parseFloat(fat || "8"),
      carbs: parseFloat(carbs || "25"),
      confidence: "low",
    };
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const _sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: _cd, error: _ce } = await _sb.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (_ce || !_cd?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  const fallback = (name: string) => ({
    meal_name: name || "Блюдо",
    total_calories: 200,
    protein: 10,
    fat: 8,
    carbs: 25,
    fiber: 0,
    confidence: "low",
    portion_description: "1 порция",
    data_source: "estimation",
  });

  try {
    const { mealDescription, quantityDescription, foodCategory, clarifications, language, portionSize } = await req.json();

    if (!mealDescription?.trim()) {
      return new Response(JSON.stringify(fallback("")), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify(fallback(mealDescription)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = langMap[language] || "Russian";
    const qtyInfo = quantityDescription || (portionSize ? `${portionSize} portion` : "medium portion");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a nutrition calculator. You MUST return ONLY a single JSON object, nothing else. No text before or after. No markdown. No explanation. No steps. Just pure JSON.`,
          },
          {
            role: "user",
            content: `Calculate ACCURATE calories for this meal. Be PRECISE - do not overestimate.

Meal: "${mealDescription}"
Quantity: ${qtyInfo}
Category: ${foodCategory || "unknown"}
Extra info: ${clarifications || "none"}

CRITICAL RULES:
- Use standard Eastern European portion sizes (not American restaurant portions)
- Bread slice = 30-40g = 70-80 kcal
- Butter thin spread on bread = 5-8g = 35-55 kcal
- Sausage slice (вареная колбаса) = 15-20g = 35-50 kcal
- Cheese slice = 15-20g = 50-70 kcal
- Tea with 1 tsp sugar = 15-20 kcal
- Do NOT assume thick butter layers
- Do NOT assume large portions unless explicitly specified
- "Sandwich" = 1 slice bread + thin fillings, NOT a large restaurant sandwich
- When in doubt → use LOWER estimate
- Always sanity-check: does the total make sense for a normal home meal?

Reference values per 100g:
White bread: 265 kcal | Butter: 748 kcal | Boiled sausage: 260 kcal
Hard cheese: 350-400 kcal | Tea: 0 kcal | Sugar: 400 kcal
Chicken breast: 165 kcal | Rice cooked: 130 kcal | Potato boiled: 77 kcal

Return ONLY this JSON (no text, no markdown, no explanation):
{
  "meal_name": "Name in ${lang}",
  "total_calories": 250,
  "protein": 12.5,
  "fat": 8.0,
  "carbs": 30.0,
  "sugar": 5.0,
  "fiber": 2.0,
  "portion_description": "200г",
  "breakdown": [{"ingredient": "Name", "amount": "100g", "calories": 150}],
  "data_source": "database_lookup",
  "confidence": "medium",
  "note": "Brief note"
}

Rules:
- All numeric fields MUST be numbers, not strings
- Never return null for calories
- confidence: "high" ONLY for very certain known products, "medium" for estimates
- If unsure, use conservative (lower) estimate`,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);

      if (response.status === 429) {
        return new Response(JSON.stringify({ ...fallback(mealDescription), rate_limited: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(fallback(mealDescription)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";
    let result = extractJSON(rawText);

    if (!result || (!result.total_calories && !result.calories)) {
      console.error("Failed to extract JSON from:", rawText.substring(0, 500));
      return new Response(JSON.stringify(fallback(mealDescription)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize field names
    if (result.calories && !result.total_calories) {
      result.total_calories = result.calories;
    }

    // Validate all numbers
    result.total_calories = Math.round(Number(result.total_calories) || 200);
    result.protein = Math.round((Number(result.protein) || 10) * 10) / 10;
    result.fat = Math.round((Number(result.fat) || 8) * 10) / 10;
    result.carbs = Math.round((Number(result.carbs) || 25) * 10) / 10;
    result.fiber = Math.round((Number(result.fiber) || 0) * 10) / 10;
    result.sugar = Math.round((Number(result.sugar) || 0) * 10) / 10;

    // Clean asterisks
    if (result.meal_name) result.meal_name = result.meal_name.replace(/\*+/g, "");
    if (result.note) result.note = result.note.replace(/\*+/g, "");
    if (result.portion_description) result.portion_description = result.portion_description.replace(/\*+/g, "");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("calculate-meal-calories error:", e);
    return new Response(JSON.stringify(fallback("Блюдо")), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
