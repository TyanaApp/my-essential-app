import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const { requirePaidPlan } = await import("../_shared/plan-check.ts");
    const planCheck = await requirePaidPlan(req, { cors: corsHeaders });
    if (!planCheck.ok) return planCheck.response;
    const userId = planCheck.userId;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { language } = await req.json();

    // Get last 14 days of meals
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: meals } = await supabase
      .from("meal_entries")
      .select("date, meal_type, custom_name, total_calories, total_protein, total_fat, total_carbs, created_at")
      .eq("user_id", userId)
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: true });

    if (!meals || meals.length < 7) {
      return new Response(JSON.stringify({ insights: null, reason: "not_enough_data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get calorie target
    const { data: goals } = await supabase
      .from("user_goals")
      .select("daily_calories_target")
      .eq("user_id", userId)
      .maybeSingle();

    const target = goals?.daily_calories_target || 2000;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mealSummary = meals.map(m => ({
      date: m.date,
      day: new Date(m.date).toLocaleDateString("en", { weekday: "short" }),
      type: m.meal_type,
      name: m.custom_name,
      cal: m.total_calories,
      protein: Number(m.total_protein || 0),
    }));

    const langMap: Record<string, string> = {
      en: "English", ru: "Russian", lv: "Latvian", uk: "Ukrainian",
    };
    const targetLang = langMap[language || "en"] || "English";

    const prompt = `Analyze these eating patterns from the last 14 days and give exactly 3 specific observations about this user's habits. Be specific with numbers and days.

Daily calorie target: ${target} kcal

Meal data:
${JSON.stringify(mealSummary, null, 1)}

Rules:
- Give exactly 3 insights, each 1-2 sentences max
- Be specific: mention days, exact numbers, meal types
- Mix positive and improvement observations
- Use emoji at start of each insight
- YOU MUST respond in ${targetLang}
- Return as JSON array of strings: ["insight1", "insight2", "insight3"]`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You analyze eating patterns. Return JSON array of exactly 3 insight strings. No markdown, no code blocks, just the JSON array." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_insights",
              description: "Return eating pattern insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_insights" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let insights: string[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = parsed.insights || [];
      } catch {
        insights = [];
      }
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("eating-insights error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
