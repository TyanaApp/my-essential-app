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
            content: `You are a world-class nutritionist and food scientist with access to deep knowledge of:
- Exact nutritional data for thousands of branded products
- USDA nutritional database
- European food composition databases
- Branded snacks, candies, cookies from all countries (Nuts, Snickers, KitKat, Oreo, Lay's, Pringles, Milka, Raffaello, Ferrero Rocher, Bounty, Twix, M&Ms, Haribo, Chupa Chups, Laima, Staburadze)
- Russian/Ukrainian products (Птичье молоко, Мишка косолапый, Белочка, Рот Фронт, Киевский торт, Наполеон, Оливье)
- Restaurant dishes (McDonald's, KFC, Burger King, Pizza Hut, Hesburger) and homemade recipes
- National dishes from Russia, Ukraine, Latvia, Europe (борщ, солянка, плов, вареники, пельмени, сырники, блины, драники, окрошка, серый горох, путра, скландрауси, рижский хлеб)

Your job is to give the MOST ACCURATE calorie count possible.
For branded products use exact nutritional label data.
For homemade dishes calculate from ingredients.
Never guess randomly. Always reason step by step.

Respond entirely in ${lang}. Zero asterisks, zero markdown formatting, zero bullet symbols.`,
          },
          {
            role: "user",
            content: `Calculate exact nutrition for: "${mealDescription}"
Quantity: ${qtyInfo}
Food category hint: ${foodCategory || "unknown"}
Clarifications: ${clarifications || "none"}

Think step by step:

STEP 1 - IDENTIFY:
What exactly is this product/dish?
Is it a branded product, homemade dish, simple ingredient, or restaurant dish?

STEP 2 - RESEARCH:
For BRANDED PRODUCTS: Look up exact nutritional label data. Example: Nuts chocolate bar (42g) = 221 kcal, P:4.4g, F:13.2g, C:21.8g, Sugar:18.1g
For HOMEMADE DISHES: Break down into individual ingredients with weights and calories for each.
For SIMPLE INGREDIENTS: Use exact database values per 100g, scale to quantity.

STEP 3 - CALCULATE for the exact quantity given.

STEP 4 - CONFIDENCE:
high = branded product with known label or simple ingredient with exact data
medium = homemade dish or restaurant approximation
low = very vague description

Return ONLY this JSON (no text outside JSON, no markdown):
{
  "meal_name": "Localized name with quantity info",
  "identified_as": "branded_product | homemade_dish | simple_ingredient | restaurant_dish",
  "quantity_used": "1 piece = 42g",
  "portion_description": "1 piece (42g)",
  "total_calories": 221,
  "protein": 4.4,
  "fat": 13.2,
  "carbs": 21.8,
  "sugar": 18.1,
  "fiber": 0.8,
  "breakdown": [
    {"ingredient": "Ingredient name", "amount": "15g", "calories": 79},
    {"ingredient": "Ingredient name", "amount": "8g", "calories": 32}
  ],
  "data_source": "official_label | recipe_calculation | database_lookup | estimation",
  "confidence": "high",
  "note": "Brief note about the calculation"
}

The breakdown array should have 2-6 items showing the main components.
For branded products: show main ingredient components.
For homemade dishes: show individual ingredients.
For simple ingredients: can be a single item or empty array.`,
          },
        ],
        max_tokens: 600,
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

    // Clean any accidental asterisks
    if (result.meal_name) result.meal_name = result.meal_name.replace(/\*+/g, '');
    if (result.note) result.note = result.note.replace(/\*+/g, '');
    if (result.portion_description) result.portion_description = result.portion_description.replace(/\*+/g, '');

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
