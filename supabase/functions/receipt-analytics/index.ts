import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { receipts, language, monthlyBudget } = await req.json();
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
          content: `YOU MUST respond in ${langMap[language] || 'English'}.

Analyze these shopping receipts and give insights.

Receipts data: ${JSON.stringify(receipts)}
Monthly budget: ${monthlyBudget || 'unknown'}

Give 3-4 specific insights. Return ONLY valid JSON (no markdown, no backticks):
{
  "totalSpent": 234.50,
  "avgWeekly": 58.60,
  "topProducts": ["Milk", "Eggs", "Bread"],
  "categories": [
    {"name": "Dairy", "amount": 45.20, "percent": 19, "emoji": "🥛"},
    {"name": "Meat", "amount": 78.30, "percent": 33, "emoji": "🥩"}
  ],
  "insights": [
    "You spend €78/month on meat — that's 33% of your budget",
    "You buy milk every 4 days — consider buying 2L at once"
  ],
  "savingTip": "Buying cereals in bulk once a month could save ~€15",
  "monthComparison": {
    "current": 234.50,
    "previous": 257.00,
    "diff": -22.50
  }
}

Rules:
- Be specific with numbers
- Categories should cover main food groups
- insights array: 2-4 items
- All text in ${langMap[language] || 'English'}`
        }],
        max_tokens: 800,
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
    console.error("receipt-analytics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
