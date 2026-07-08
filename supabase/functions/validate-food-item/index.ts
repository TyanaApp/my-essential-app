import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enforceAiQuota } from "../_shared/quota-check.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const _q = await enforceAiQuota(req, { cors: corsHeaders, requirePaid: false });
  if (!_q.ok) return _q.response;
  try {
    const { itemName, language } = await req.json();

    if (!itemName || itemName.trim().length === 0) {
      return new Response(JSON.stringify({ isFood: false, reason: "Empty name" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback: allow everything if no API key
      return new Response(JSON.stringify({ isFood: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: `Is "${itemName}" a food item, drink, cooking ingredient, or spice that can be consumed by humans?
Answer ONLY with JSON: {"isFood": true/false, "reason": "short reason in ${lang} if false"}
Do NOT wrap in markdown code blocks. Return raw JSON only.`,
          },
        ],
        max_tokens: 80,
      }),
    });

    if (!response.ok) {
      // On API error, allow the item
      return new Response(JSON.stringify({ isFood: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    
    let result = { isFood: true, reason: "" };
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { isFood: true, reason: "" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-food-item error:", e);
    return new Response(JSON.stringify({ isFood: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
