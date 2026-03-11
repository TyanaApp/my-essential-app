import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { imageBase64, language, recalculate, itemName, portion, dislikedFoods } = body;

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RECALCULATE MODE: single item nutrition recalculation
    if (recalculate && itemName) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: `Recalculate nutrition for "${itemName}", portion: ${portion || "100g"}.
Return ONLY JSON, no markdown:
{"calories":X,"protein":X,"fat":X,"carbs":X}
Be realistic. Values in grams for macros, kcal for calories.`
          }],
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI error:", response.status, errorText);
        return new Response(JSON.stringify({ error: "Recalculation failed" }), {
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
        result = { error: true };
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IMAGE SCAN MODE
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langHint = language === 'ru' ? 'Use Russian for meal_name and item names.' 
      : language === 'lv' ? 'Use Latvian for meal_name and item names.' 
      : 'Use English for meal_name and item names.';

    const dislikedList = (dislikedFoods || []).join(', ');
    const dislikeCheck = dislikedList 
      ? `\n\nIMPORTANT: The user dislikes these foods: ${dislikedList}. If any detected item matches a disliked food, add "disliked": true to that item in the items array.`
      : '';

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: "text", text: `Analyze this meal photo. Identify what food is on the plate and estimate calories and macros.
${langHint}${dislikeCheck}
Return ONLY JSON, no markdown or code fences:
{
  "meal_name": "Pasta with tomato sauce",
  "calories": 450,
  "protein": 15,
  "fat": 12,
  "carbs": 68,
  "items": [
    {"name": "Pasta", "calories": 300, "portion": "150g", "disliked": false},
    {"name": "Tomato sauce", "calories": 80, "portion": "100ml", "disliked": false}
  ],
  "confidence": "medium"
}
confidence must be one of: "high", "medium", "low".
Be realistic with portions. If unclear, estimate conservatively.` }
          ]
        }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
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
      result = { error: true };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-meal-calories error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
