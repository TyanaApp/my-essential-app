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
    const { transcript, language } = await req.json();
    if (!transcript) {
      return new Response(JSON.stringify({ error: "No transcript provided" }), {
        status: 400,
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
          content: `Extract shopping items from this voice input: "${transcript}"
Language: ${language || 'en'}

STRICT RULES:
- Return EXACTLY ONE item per product mentioned. Never return variants or alternatives.
- If the user says "говядина 3кг" return ONLY [{"name":"Говядина","quantity":3,"unit":"kg"}]
- If quantity is not mentioned, default to 1 pcs.
- Keep item names in the same language as the input.
- Be specific: "молоко и яйца" = [{"name":"Молоко","quantity":1,"unit":"L"},{"name":"Яйца","quantity":10,"unit":"pcs"}]
- "пол литра молока" = {"name":"Молоко","quantity":0.5,"unit":"L"}
- "puslitru piena" = {"name":"Piens","quantity":0.5,"unit":"L"}

Return ONLY a JSON array, no markdown, no alternatives, no explanations.`
        }],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI parsing failed" }), {
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
    console.error("parse-voice-shopping error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
