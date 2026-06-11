import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageInstructions: Record<string, string> = {
  ru: 'Отвечай ТОЛЬКО на русском языке. Все названия продуктов пиши на русском.',
  en: 'Respond in English only. All product names must be in English.',
  uk: 'Відповідай ТІЛЬКИ українською мовою. Всі назви продуктів пиши українською.',
  lv: 'Atbildi TIKAI latviešu valodā. Visi produktu nosaukumi jābūt latviešu valodā.',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images, language: reqLang } = await req.json();
    const language = reqLang && languageInstructions[reqLang] ? reqLang : 'en';

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { requirePaidPlan } = await import("../_shared/plan-check.ts");
    const planCheck = await requirePaidPlan(req, { cors: corsHeaders });
    if (!planCheck.ok) return planCheck.response;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langInstruction = languageInstructions[language];

    const prompt = `${langInstruction}

You are scanning a fridge shelf photo.
List EVERY visible food product. Be aggressive — if you can partially see something, include it.

Look carefully at:
- All bottles, jars, containers
- Packages and boxes
- Loose vegetables and fruits
- Dairy products
- Leftovers in containers
- Condiments and sauces

IMPORTANT:
- Only return actual food items, drinks, and cooking ingredients.
- SKIP non-food items: pots, pans, dishes, bowls, plates, containers, utensils, cookware, cleaning products.
- If you see a covered pot/bowl with unknown contents — add ONE item with unknown=true.
- Product names MUST be in ${language === 'ru' ? 'Russian' : language === 'uk' ? 'Ukrainian' : language === 'lv' ? 'Latvian' : 'English'}.
- Never respond in English if language is not 'en'.
- Examples: Milk → ${language === 'ru' ? 'Молоко' : language === 'uk' ? 'Молоко' : language === 'lv' ? 'Piens' : 'Milk'}, Eggs → ${language === 'ru' ? 'Яйца' : language === 'uk' ? 'Яйця' : language === 'lv' ? 'Olas' : 'Eggs'}, Cheese → ${language === 'ru' ? 'Сыр' : language === 'uk' ? 'Сир' : language === 'lv' ? 'Siers' : 'Cheese'}, Butter → ${language === 'ru' ? 'Масло' : language === 'uk' ? 'Масло' : language === 'lv' ? 'Sviests' : 'Butter'}

For each item, assign a category from: dairy, meat, produce, drinks, eggs, other.
Be specific with names. Estimate quantities realistically. Use units: g, kg, ml, L, pcs, packs.
Remove duplicates. Combine all visible items into one list.

Return ONLY a valid JSON array, no markdown or code fences:
[{"name":"${language === 'ru' ? 'Яйца' : 'Eggs'}","quantity":6,"unit":"pcs","category":"eggs","unknown":false}]`;

    // Process all images in parallel for speed
    const scanImage = async (img: string) => {
      const content: any[] = [
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${img}`, detail: "low" },
        },
        { type: "text", text: prompt },
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content }],
          max_tokens: 1000,
          temperature: 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        return [];
      }

      const data = await response.json();
      try {
        const text = data.choices?.[0]?.message?.content || "[]";
        return JSON.parse(text.replace(/```json|```/g, "").trim());
      } catch {
        return [];
      }
    };

    // Parallel scan of all images
    const results = await Promise.all(images.map((img: string) => scanImage(img)));

    // Merge and deduplicate
    const allItems: any[] = [];
    for (const items of results) {
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const isDup = allItems.some(
          (existing) => existing.name?.toLowerCase?.()?.trim() === item.name?.toLowerCase?.()?.trim()
        );
        if (!isDup) allItems.push(item);
      }
    }

    return new Response(JSON.stringify({ items: allItems }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-fridge error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
