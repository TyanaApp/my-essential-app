import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            {
              type: "text",
              text: `YOU MUST respond in ${langMap[language] || 'English'}.

This is a shopping receipt. Extract all purchased items.
Return ONLY valid JSON (no markdown, no backticks):
{
  "store": "Store name if visible",
  "total": 23.50,
  "currency": "EUR",
  "date": "2026-03-08",
  "items": [
    {
      "name": "Item name in ${langMap[language] || 'English'}",
      "quantity": 1,
      "unit": "L",
      "price": 1.29,
      "isFood": true,
      "suggestedStorage": "fridge"
    }
  ]
}

Rules:
- unit: "g", "kg", "ml", "L", "pcs", "pack"
- suggestedStorage: "fridge" / "pantry" / "freezer" / null (null for non-food)
- isFood: true for food/drinks, false for cleaning/hygiene/household items
- Be smart: milk→fridge, pasta→pantry, meat→fridge, ice cream→freezer
- If currency not visible, default to "EUR"
- Translate item names to ${langMap[language] || 'English'}`
            }
          ]
        }],
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";

    let result: any = {};
    try {
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      console.error("Failed to parse AI response:", text);
      result = { error: true, raw: text };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-receipt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
