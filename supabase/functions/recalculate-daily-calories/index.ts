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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    // Get profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("gender")
      .eq("user_id", userId)
      .maybeSingle();

    // Get goals
    const { data: goals } = await supabase
      .from("user_goals")
      .select("weight_kg, height_cm, age, activity_level, goals, daily_calories_target, weight_loss_speed")
      .eq("user_id", userId)
      .maybeSingle();

    if (!goals || !goals.weight_kg || !goals.height_cm || !goals.age) {
      return new Response(JSON.stringify({ error: "Missing body data", target: goals?.daily_calories_target || 2000 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get last 7 days meal data
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: meals } = await supabase
      .from("meal_entries")
      .select("total_calories, total_protein, total_fat, total_carbs, date")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo);

    const mealData = meals || [];
    const avgCalories = mealData.length > 0
      ? mealData.reduce((s, m) => s + (m.total_calories || 0), 0) / 7
      : 0;

    // BMR (Mifflin-St Jeor)
    const weight = Number(goals.weight_kg);
    const height = Number(goals.height_cm);
    const age = Number(goals.age);
    const gender = profile?.gender || "female";

    const BMR = gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    const activityMultiplier: Record<string, number> = {
      low: 1.2, normal: 1.375, moderate: 1.375, active: 1.55, very_active: 1.725,
    };
    const mult = activityMultiplier[goals.activity_level || "moderate"] || 1.375;
    const TDEE = BMR * mult;

    // Deficit/surplus based on goal
    const deficitMap: Record<string, number> = { slow: -250, moderate: -500, fast: -750, intense: -1000 };
    const userGoals: string[] = goals.goals || [];
    let baseTarget = TDEE;
    if (userGoals.includes("lose_weight") || userGoals.includes("lose")) {
      const speed = (goals as any).weight_loss_speed || "moderate";
      baseTarget = TDEE + (deficitMap[speed] || -500);
    }
    if (userGoals.includes("build_muscle") || userGoals.includes("gain")) baseTarget = TDEE + 200;

    // Safety minimums
    const minCal = gender === "male" ? 1500 : 1200;
    baseTarget = Math.max(baseTarget, minCal);

    // Adaptive adjustment based on last 7 days
    let adjustment = 0;
    if (avgCalories > 0) {
      if (avgCalories < baseTarget * 0.8) adjustment = -50;
      if (avgCalories > baseTarget * 1.2) adjustment = +100;
    }

    // Day of week adjustments
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) adjustment += 100; // Weekend
    if (dayOfWeek === 1) adjustment -= 50; // Monday

    let finalTarget = Math.round(Math.max(baseTarget + adjustment, minCal));

    // Get yesterday's target for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    const { data: yesterdayHistory } = await supabase
      .from("calorie_history")
      .select("target")
      .eq("user_id", userId)
      .eq("date", yesterdayStr)
      .maybeSingle();

    const previousTarget = yesterdayHistory?.target || goals.daily_calories_target || 2000;
    const change = finalTarget - previousTarget;

    // Update user_goals
    await supabase
      .from("user_goals")
      .update({
        daily_calories_target: finalTarget,
        last_recalculated: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // Save to calorie_history (upsert)
    const todayStr = new Date().toISOString().split("T")[0];
    await supabase
      .from("calorie_history")
      .upsert({
        user_id: userId,
        date: todayStr,
        target: finalTarget,
        base_tdee: Math.round(TDEE),
        adjustment,
        avg_last_7_days: Math.round(avgCalories),
      }, { onConflict: "user_id,date" });

    return new Response(JSON.stringify({
      target: finalTarget,
      base_tdee: Math.round(TDEE),
      adjustment,
      avg_last_7_days: Math.round(avgCalories),
      change,
      day_type: dayOfWeek === 0 || dayOfWeek === 6 ? "weekend" : dayOfWeek === 1 ? "monday" : "weekday",
      goal_adjustment: userGoals.includes("lose_weight") || userGoals.includes("lose")
        ? (deficitMap[(goals as any).weight_loss_speed || "moderate"] || -500)
        : userGoals.includes("build_muscle") || userGoals.includes("gain") ? 200 : 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recalculate-daily-calories error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
