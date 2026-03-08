import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { images } = await req.json();
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const content: any[] = images.map((img: string) => ({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${img}` },
    }));

    content.push({
      type: "text",
      text: `Analyze this fridge photo.

IMPORTANT: Only return actual food items, drinks, and cooking ingredients.
If you see non-food items (dishes, utensils, cleaning products, containers, pots, pans, bowls, plates, cookware) → skip them entirely. Never include non-food items in the response.

SKIP entirely: pots, pans, dishes, bowls, plates, containers, utensils, cookware, cleaning products, packaging materials.

If you see a covered pot or bowl with unknown contents - add ONE item: 'Covered dish (unknown contents)' with unknown=true.

For each item, assign a category from: dairy, meat, produce, drinks, eggs, other.

Return ONLY a valid JSON array, no markdown or code fences:
[{"name":"Eggs","quantity":6,"unit":"pcs","category":"eggs","unknown":false},{"name":"Covered dish","quantity":1,"unit":"pcs","category":"other","unknown":true}]

Be specific with names: not 'sauce' but 'Ketchup'.
Estimate quantities realistically.
Use units: g, kg, ml, L, pcs, packs.
Remove duplicates. Combine all visible items into one list.`,
    });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content }],
        max_tokens: 1000,
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
    let items = [];

    try {
      const text = data.choices?.[0]?.message?.content || "[]";
      items = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      items = [];
    }

    return new Response(JSON.stringify({ items }), {
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
