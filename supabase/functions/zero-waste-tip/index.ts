import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inventory, recentMeals, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ confidence: "low", tip: null, title: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    const inventoryList = (inventory || []).map((i: any) =>
      `${i.name} - ${i.quantity || '?'}${i.unit || 'pcs'}, expires: ${i.expires_at || 'no date'}, location: ${i.storage_location || '?'}`
    ).join('\n') || 'empty inventory';

    const recentItems = (recentMeals || []).map((m: any) => m.custom_name || m.name || '').filter(Boolean);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "system",
          content: `You are a world-class zero waste expert and creative sustainability consultant.

Before giving ANY tip you must:
STEP 1 - Deeply analyze what the user actually has
STEP 2 - Find the single most valuable insight
STEP 3 - Only then write the tip

RULES:
- Only give tips about products user ACTUALLY HAS in their inventory
- Never give generic home tips not related to their products
- Focus on: food scraps reuse, secondary use of packaging, smart storage to extend shelf life, creative use of wilting/leftover ingredients
- Each tip must have specific actionable steps
- If you cannot find a genuinely useful tip, say so honestly - don't invent something useless
- Respond entirely in ${lang}
- No asterisks, no markdown, clean prose only`
        }, {
          role: "user",
          content: `Analyze this user's inventory deeply and find ONE genuinely valuable zero waste insight.

Current inventory:
${inventoryList}

Recently used/bought:
${recentItems.join(', ') || 'none'}

Think step by step:

ANALYSIS:
1. What is about to expire that could be used differently?
2. What scraps from recent cooking could be reused?
3. What is being stored wrong and losing quality faster?
4. What combination of items could prevent waste?

QUALITY CHECK before writing:
- Is this tip specific to their actual products? YES/NO
- Does this tip provide real value? YES/NO
- Is this more useful than obvious advice? YES/NO

If any answer is NO, find a different tip.

Only after passing quality check, return JSON (no markdown, no code blocks):
{"title":"Short specific title max 5 words","tip":"Full tip with specific steps. Reference actual product names from inventory. Include exact instructions.","product":"Main product this tip is about","category":"food|beauty|cleaning|garden|home","emoji":"🍊","why_valuable":"One sentence why this saves money or reduces waste","confidence":"high|medium","based_on":"Exactly what in inventory triggered this tip"}

If truly no good tip found:
{"title":null,"tip":null,"confidence":"low"}`
        }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
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
      console.error("AI error:", response.status);
      return new Response(JSON.stringify({ confidence: "low", tip: null, title: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let result: any = {};

    try {
      const text = data.choices?.[0]?.message?.content || "{}";
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      result = { confidence: "low", tip: null, title: null };
    }

    // Clean any accidental markdown from tip text
    if (result.tip) {
      result.tip = result.tip.replace(/\*+/g, '').replace(/#+\s?/g, '').replace(/`+/g, '').trim();
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("zero-waste-tip error:", e);
    return new Response(JSON.stringify({ confidence: "low", tip: null, title: null }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
