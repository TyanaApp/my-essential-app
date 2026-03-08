import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const langMap: Record<string, string> = {
  en: "English", ru: "Russian", lv: "Latvian", uk: "Ukrainian",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealDescription, quantityDescription, foodCategory, clarifications, language,
            // Legacy support
            portionSize } = await req.json();

    if (!mealDescription?.trim()) {
      return new Response(JSON.stringify({ error: "No meal description" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lang = langMap[language] || "English";

    // Build quantity context
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
            content: `You are a world-class nutritionist calculator. You receive a meal description with a SPECIFIC quantity indicator and must calculate precise nutrition.

YOU MUST respond entirely in ${lang}. No exceptions.

QUANTITY INTERPRETATION RULES:
- "1 piece" of a named candy bar (Snickers, Nuts, KitKat, Mars, Twix, Bounty) → look up the EXACT standard weight and calories for that bar
- "handful ~30g" of nuts → use 30g as base weight
- "cup ~200ml" → 200ml of the described drink
- "glass ~250ml" → 250ml
- "small piece" / "medium piece" / "large piece" → estimate weight based on food type (cake slice small=80g, medium=120g, large=180g; pizza slice small=100g, medium=150g, large=200g)
- "half bowl ~150g" / "normal bowl ~300g" / "full bowl ~400g" / "big bowl ~500g" → use those gram estimates for soups, porridge, salad, rice
- "1 small fruit" / "1 medium fruit" / "1 large fruit" → apple small=120g, medium=180g, large=230g; banana small=90g, medium=120g, large=150g; etc.
- "small handful ~15g" / "handful ~80g" for berries/grapes → use those gram estimates
- "bowl ~150g" / "big bowl ~250g" for berries → use those
- "half pack" / "1 pack" / "2 packs" → use standard package sizes (yogurt=125g, cottage cheese=200g, kefir=500ml, sour cream=200g)
- "small portion" / "normal portion" / "large portion" / "very large portion" → estimate based on typical serving sizes
- If quantity includes "g" or "kg" → use exact weight provided
- If quantity includes number + "pieces" → multiply single item nutrition

Be PRECISE with numbers. Use real nutritional data.

Return ONLY valid JSON, no markdown, no code fences, no extra text.`,
          },
          {
            role: "user",
            content: `Meal: "${mealDescription}"
Quantity: ${qtyInfo}
Food category hint: ${foodCategory || "unknown"}
Clarifications: ${clarifications || "none"}

Calculate nutrition step by step:
1. Identify the exact food item(s)
2. Determine weight in grams based on the quantity description
3. Calculate macros for that exact weight

Return ONLY this JSON:
{
  "meal_name": "Localized meal name with quantity (e.g. 'Snickers — 1 bar (50g)' or 'Nuts — handful (30g)')",
  "portion_description": "Quantity description with estimated grams, e.g. '1 piece (50g)' or 'handful (~30g)' or 'normal bowl (~300g)'",
  "total_calories": 250,
  "protein": 3,
  "fat": 12,
  "carbs": 33,
  "confidence": "high",
  "note": "Brief note about calculation"
}
confidence: "high" = exact known product or clear quantity, "medium" = reasonable estimate, "low" = very vague input.`,
          },
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let result: any = {};

    try {
      const text = data.choices?.[0]?.message?.content || "{}";
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      console.error("Failed to parse AI response:", data.choices?.[0]?.message?.content);
      result = { error: true };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("calculate-meal-calories error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
