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
    const { items, language } = await req.json();

    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { ru: "Russian", lv: "Latvian", en: "English" };
    const lang = langMap[language] || "English";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const itemsList = items
      .map((i: any) => `${i.name} (${i.days <= 0 ? `expired ${Math.abs(i.days)} days ago` : `expires in ${i.days} days`})`)
      .join(", ");

    const prompt = `These food items are expiring soon or already expired: ${itemsList}

For each item suggest in ${lang}:
- If still usable: one quick recipe idea (max 10 words)
- If expired but can be repurposed: suggest how (e.g. 'Use in smoothie', 'Make stock')
- If should be thrown: say 'Best to discard'

Return ONLY valid JSON array, no markdown:
[{"name":"ItemName","suggestion":"short suggestion","action":"use|use_or_discard|discard"}]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let suggestions = [];
    try {
      const text = data.choices?.[0]?.message?.content || "[]";
      suggestions = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      suggestions = [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("expiring-suggestions error:", e);
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
