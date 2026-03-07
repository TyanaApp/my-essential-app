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
    const { userProfile, todayMeals, weekMeals, inventory, userGoals, language, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { ru: "Russian", lv: "Latvian", en: "English" };
    const lang = langMap[language] || "English";

    const userDataPrompt = `User profile:
- Goal: ${userGoals?.goals?.join(', ') || 'not set'}
- Daily calorie target: ${userGoals?.daily_calories_target || 2000} kcal
- Diet type: ${userGoals?.diet_type || 'omnivore'}
- Allergies: ${userGoals?.allergies?.join(', ') || 'none'}
- Weight: ${userProfile?.weight_kg || '?'}kg, Height: ${userProfile?.height_cm || '?'}cm
- Age: ${userProfile?.age || '?'}, Activity: ${userProfile?.activity_level || 'normal'}

Today's meals and nutrition:
${JSON.stringify(todayMeals || [])}

This week's average:
- Avg calories: ${weekMeals?.avgCalories || 0} kcal
- Avg protein: ${weekMeals?.avgProtein || 0}g
- Avg fat: ${weekMeals?.avgFat || 0}g
- Avg carbs: ${weekMeals?.avgCarbs || 0}g

What's in their fridge now:
${(inventory || []).slice(0, 10).map((i: any) => i.name).join(', ') || 'unknown'}`;

    let systemPrompt: string;
    
    if (mode === 'full') {
      systemPrompt = `You are an expert nutritionist and health coach. Give a detailed nutrition analysis in ${lang}. Structure your response EXACTLY like this with these emoji headers on separate lines:

📊 Overall assessment
(2-3 sentences)

✅ What's going well
(2-3 bullet points)

⚠️ What to improve
(2-3 bullet points with specific actions)

🍽 Today's recommendations
(what to eat for remaining meals, be specific)

📈 Weekly prediction
(if they continue this way, what happens in 1-2 weeks)

YOU MUST respond ENTIRELY in ${lang}. Be specific, use their actual numbers. Be warm and motivating.`;
    } else {
      systemPrompt = `You are an expert nutritionist and health coach. Analyze the user's data deeply and give ONE specific, actionable advice today. Be like a personal nutritionist who knows everything about this person. Respond in ${lang}. Be warm, specific, and motivating. Max 3 sentences.

Examples of good advice:
- "You only had 45g protein today with a target of 120g. Add chicken breast or eggs for dinner — you have them in your fridge!"
- "This week you're exceeding fat intake by 30%. Try replacing cheese in salads with avocado"
- "Great! You've maintained a calorie deficit for 3 days straight 🔥 At this rate, minus 0.3kg per week"

Be this specific and personal. Use their actual food data. YOU MUST respond ENTIRELY in ${lang}.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userDataPrompt },
        ],
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
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const advice = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ advice }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nutrition-advice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
