import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Pre-filter: skip if inventory is empty or only trivial items
    const items = inventory || [];
    if (items.length === 0) {
      return new Response(JSON.stringify({ confidence: "low", tip: null, title: null, reason: "Empty inventory" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    const inventoryList = items.map((i: any) =>
      `${i.name} - qty: ${i.quantity || '?'} ${i.unit || 'pcs'}, expires: ${i.expires_at || 'no date'}, location: ${i.storage_location || '?'}`
    ).join('\n');

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
          content: `You are a world-class zero waste expert. You ONLY give tips that are genuinely surprising and valuable.

STRICT RULES - follow exactly:

1. ONLY give tips about products the user ACTUALLY HAS in their inventory
2. Every tip must reference specific product names from inventory
3. Respond entirely in ${lang}
4. No asterisks, no markdown, no code blocks - clean prose only

BANNED TIPS - NEVER suggest any of these:
- Saving wrappers, packaging, candy wrappers, foil, plastic for "reuse"
- "Store leftovers in a container" (obvious)
- "Plan your meals" (generic advice)
- "Make a shopping list" (generic advice)
- "Eat leftovers tomorrow" (obvious)
- "Don't throw away food" (obvious)
- "Freeze it for later" without specific creative instructions
- Any tip about saving trash, wrappers, or packaging materials
- Tips about products user only has 1 small piece of (1 candy, 1 snack bar)
- Any tip that is common sense or something most people already know

ONLY WORTH A TIP when user has:
- Vegetable/fruit scraps with proven secondary uses (peels, stems, cores)
- Something genuinely expiring in 1-2 days with a creative solution
- Coffee grounds, citrus peels, herb stems, stale bread, wilting greens
- Overripe fruit that can be transformed
- Items being stored in wrong location losing quality faster
- Combinations of items that together prevent waste in non-obvious ways

The tip must pass ALL 5 quality gates:
Q1: Would a smart person think "I didn't know that, that's useful"? If NO → return null
Q2: Is this tip specific to products they actually have? If NO → return null
Q3: Am I suggesting saving trash or packaging? If YES → return null
Q4: Is this obvious common sense? If YES → return null
Q5: Does user have enough of this product to make the tip worthwhile? If NO → return null

If ANY gate fails → you MUST return null. Better no tip than a useless one.`
        }, {
          role: "user",
          content: `Analyze this inventory. Find ONE genuinely valuable zero waste insight - or return null if nothing qualifies.

Current inventory:
${inventoryList}

Recently cooked/used:
${recentItems.join(', ') || 'none'}

STEP 1 - Scan for tip-worthy items:
- Any items expiring in 1-2 days?
- Any items with valuable scraps (citrus peels, coffee grounds, herb stems, stale bread, wilting produce)?
- Any items stored in wrong location?
- Any creative combinations?

STEP 2 - If you found something, run quality gates:
Q1: Non-obvious? Q2: Specific? Q3: Not trash-saving? Q4: Not common sense? Q5: Enough quantity?

STEP 3 - If ALL gates pass, return JSON (raw, no markdown):
{"title":"Max 5 words","tip":"Specific steps referencing actual product names","product":"Main product","category":"food|beauty|cleaning|garden|home","emoji":"🍊","why_valuable":"One sentence","confidence":"high|medium","based_on":"What triggered this tip"}

If no tip passes all gates, return:
{"title":null,"tip":null,"confidence":"low","reason":"No genuinely valuable tip found for current inventory"}`
        }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("AI error:", response.status, body);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    // Server-side quality filter: reject trash/packaging tips
    if (result.tip) {
      const tipLower = result.tip.toLowerCase();
      const bannedPatterns = [
        'wrapper', 'обёртк', 'обертк', 'упаковк', 'фантик', 'фольг',
        'пластик', 'пакет', 'packaging', 'foil', 'plastic bag',
        'сохрани на потом', 'save for later', 'храни в контейнер',
        'store in container', 'планируй', 'plan your', 'список покупок',
        'shopping list', 'не выбрасывай', 'don\'t throw',
      ];
      const isBanned = bannedPatterns.some(p => tipLower.includes(p));
      if (isBanned) {
        result = { confidence: "low", tip: null, title: null, reason: "Filtered: banned pattern detected" };
      }
    }

    // Clean any accidental markdown
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
