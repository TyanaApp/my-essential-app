import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageNames: Record<string, string> = {
  ru: 'Russian', en: 'English', lv: 'Latvian', uk: 'Ukrainian',
};

const languageInstructions: Record<string, string> = {
  ru: 'Отвечай ТОЛЬКО на русском языке. Все названия продуктов и блюд пиши на русском.',
  en: 'Respond in English only. All food names must be in English.',
  lv: 'Atbildi TIKAI latviešu valodā. Visi produktu nosaukumi latviešu valodā.',
  uk: 'Відповідай ТІЛЬКИ українською мовою. Всі назви продуктів пиши українською.',
};

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

  try {
    const body = await req.json();
    const { imageBase64, language, recalculate, itemName, portion, dislikedFoods } = body;
    const lang = language || 'en';
    const langInstruction = languageInstructions[lang] || languageInstructions.en;
    const langName = languageNames[lang] || 'English';

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RECALCULATE MODE
    if (recalculate && itemName) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Recalculate nutrition for "${itemName}", portion: ${portion || "100g"}.\nReturn ONLY JSON, no markdown:\n{"calories":X,"protein":X,"fat":X,"carbs":X}\nBe realistic. Values in grams for macros, kcal for calories.` }],
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI error:", response.status, await response.text());
        return new Response(JSON.stringify({ error: "Recalculation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await response.json();
      let result: any = {};
      try {
        const text = data.choices?.[0]?.message?.content || "{}";
        result = JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch { result = { error: true }; }

      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // IMAGE SCAN MODE
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "No image provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const dislikedList = (dislikedFoods || []).join(', ');
    const dislikeCheck = dislikedList
      ? `\nIMPORTANT: The user dislikes these foods: ${dislikedList}. If any detected item matches a disliked food, add "disliked": true to that item.`
      : '';

    const prompt = `${langInstruction}

Analyze this food photo carefully. Identify ALL food and drinks visible.
Even simple items like tea, coffee, bread, butter, water.

CRITICAL RULES:
- ALWAYS find something to analyze. NEVER say "cannot recognize" or return an error.
- Tea/coffee → estimate with milk/sugar if visible (tea ~200ml = 2-15 kcal)
- Bread/toast → estimate as slice ~30g (~80 kcal)
- If photo is blurry → still estimate what you can see
- If you see a plate/cup → assume there is food/drink in it
- Always return your BEST estimate, even if uncertain
- All food names MUST be in ${langName} language
${dislikeCheck}

Return ONLY valid JSON, no markdown or code fences:
{
  "meal_name": "descriptive meal name in ${langName}",
  "calories": total_calories_number,
  "protein": total_protein_grams,
  "fat": total_fat_grams,
  "carbs": total_carbs_grams,
  "items": [
    {"name": "item name in ${langName}", "calories": number, "portion": "estimated portion", "disliked": false}
  ],
  "confidence": "high" or "medium" or "low"
}
Be realistic with portions. If unclear, estimate conservatively.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            { type: "text", text: prompt }
          ]
        }],
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let result: any = {};

    try {
      const text = data.choices?.[0]?.message?.content || "{}";
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      // Try harder to extract JSON
      try {
        const raw = data.choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          result = { error: true };
        }
      } catch {
        result = { error: true };
      }
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("scan-meal-calories error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
