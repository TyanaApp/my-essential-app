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
    const { mealDescription, portionSize, clarifications, language } = await req.json();

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
            content: `You are a professional nutritionist. User describes meal in natural language WITHOUT knowing exact grams. Calculate realistic nutrition based on:
- Typical home/restaurant portion sizes
- How meal was described (piece, bowl, plate, cup etc)
- Portion size selected (small/medium/large/xlarge)
- Any clarifications provided (homemade vs restaurant, with/without dressing, etc)

Be realistic, not perfect. Better to be slightly over than under.
YOU MUST respond in ${lang}.
Return ONLY valid JSON, no markdown or code fences.`,
          },
          {
            role: "user",
            content: `Meal: "${mealDescription}"
Portion size: ${portionSize || "medium"} (small/medium/large/xlarge)
Clarifications: ${clarifications || "none"}

Calculate nutrition. Think step by step:
1. What is this dish typically made of?
2. What is a typical ${portionSize || "medium"} portion in grams?
3. Calculate macros for that portion.

Return ONLY JSON:
{
  "meal_name": "Localized meal name",
  "portion_description": "Medium piece ~250g",
  "total_calories": 380,
  "protein": 18,
  "fat": 16,
  "carbs": 42,
  "confidence": "high",
  "note": "Brief note about calculation basis"
}
confidence must be one of: "high", "medium", "low".
"high" = common well-known dish, "medium" = somewhat vague, "low" = very unclear input.`,
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
