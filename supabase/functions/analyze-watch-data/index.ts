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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image, language } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Analyze the watch screenshot
    const analyzePrompt = `Analyze this smartwatch screenshot.
Extract ALL health metrics visible on screen.
Look for any of these values if present:
- Calories burned (ккал/cal)
- Heart rate (пульс/bpm)
- Steps (шаги/steps)
- Sleep (сон/sleep) - hours and quality
- Stress level or HRV
- Blood oxygen (SpO2/кислород)
- Active minutes
- Distance
- Any other health metric visible

IMPORTANT:
- Extract ONLY what is actually visible
- Do not invent values not shown
- If value unclear → skip it
- Works with ANY watch brand or app screenshot

Return ONLY valid JSON (no markdown, no code fences):
{
  "watchBrand": "Apple Watch / Garmin / Samsung / Huawei / Xiaomi / Unknown",
  "metrics": {
    "caloriesBurned": 320,
    "heartRate": 72,
    "heartRateMin": 58,
    "heartRateMax": 145,
    "steps": 8420,
    "sleepHours": 7.5,
    "sleepQuality": "good",
    "stressLevel": 35,
    "bloodOxygen": 98,
    "activeMinutes": 45,
    "distance": 6.2
  },
  "dataDate": "today or specific date if shown",
  "confidence": "high/medium/low"
}
Skip any metric not visible - use null.`;

    const analyzeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
                detail: "high",
              },
            },
            { type: "text", text: analyzePrompt },
          ],
        }],
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!analyzeResponse.ok) {
      const errorText = await analyzeResponse.text();
      console.error("AI analyze error:", analyzeResponse.status, errorText);
      if (analyzeResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (analyzeResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Analysis failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const analyzeData = await analyzeResponse.json();
    let metricsText = analyzeData.choices?.[0]?.message?.content || "{}";
    metricsText = metricsText.replace(/```json|```/g, "").trim();

    let metrics;
    try {
      metrics = JSON.parse(metricsText);
    } catch {
      console.error("Failed to parse metrics:", metricsText);
      return new Response(JSON.stringify({ error: "Could not parse watch data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Get user goals for personalized advice
    const { data: goalsData } = await supabase
      .from("user_goals")
      .select("daily_calories_target, goals, diet_type")
      .eq("user_id", user.id)
      .maybeSingle();

    const dailyCalories = goalsData?.daily_calories_target || 2000;
    const userGoal = (goalsData?.goals || []).join(", ") || "eat well";

    const langMap: Record<string, string> = { ru: "Russian", lv: "Latvian", en: "English", uk: "Ukrainian" };
    const lang = langMap[language] || "English";

    // Step 3: Generate personalized advice
    const advicePrompt = `User health data from smartwatch today:
${JSON.stringify(metrics.metrics, null, 2)}

User profile:
- Goal: ${userGoal}
- Daily calorie target: ${dailyCalories}

Analyze this data and provide:
1. Adjusted calorie recommendation for today
2. One specific actionable health tip

Consider:
- If calories burned high → increase food intake
- If sleep poor → recommend recovery foods
- If stress high → recommend calming foods/habits
- If steps low → recommend light movement
- If heart rate high → recommend rest

Respond ENTIRELY in ${lang}.
Return ONLY valid JSON (no markdown, no code fences):
{
  "adjustedCalories": 1950,
  "calorieAdjustment": 150,
  "adjustmentReason": "reason in ${lang}",
  "tip": "specific advice in 1-2 sentences in ${lang}",
  "tipCategory": "sleep/stress/activity/nutrition/recovery",
  "tipEmoji": "😴"
}`;

    const adviceResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: advicePrompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    let advice = null;
    if (adviceResponse.ok) {
      const adviceData = await adviceResponse.json();
      let adviceText = adviceData.choices?.[0]?.message?.content || "";
      adviceText = adviceText.replace(/```json|```/g, "").trim();
      try {
        advice = JSON.parse(adviceText);
      } catch {
        console.error("Failed to parse advice:", adviceText);
      }
    } else {
      await adviceResponse.text(); // consume body
    }

    // Step 4: Save to database
    const today = new Date().toISOString().split("T")[0];
    const m = metrics.metrics || {};

    await supabase.from("watch_data" as any).upsert({
      user_id: user.id,
      date: today,
      calories_burned: m.caloriesBurned || null,
      heart_rate: m.heartRate || null,
      heart_rate_min: m.heartRateMin || null,
      heart_rate_max: m.heartRateMax || null,
      steps: m.steps || null,
      sleep_hours: m.sleepHours || null,
      sleep_quality: m.sleepQuality || null,
      stress_level: m.stressLevel || null,
      blood_oxygen: m.bloodOxygen || null,
      active_minutes: m.activeMinutes || null,
      distance_km: m.distance || null,
      watch_brand: metrics.watchBrand || "Unknown",
      confidence: metrics.confidence || "medium",
      raw_metrics: metrics,
      advice: advice,
    } as any, { onConflict: "user_id,date" });

    return new Response(
      JSON.stringify({ metrics, advice }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-watch-data error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
