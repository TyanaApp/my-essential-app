import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

    const authHeader = req.headers.get("Authorization");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!authHeader || authHeader.replace("Bearer ", "") !== serviceKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartISO = weekStart.toISOString();

    // Get all users with weekly_report_enabled (default true)
    const { data: profiles, error: profilesErr } = await supabase
      .from("profiles")
      .select("user_id, display_name, weekly_report_enabled, streak_current")
      .or("weekly_report_enabled.is.null,weekly_report_enabled.eq.true");

    if (profilesErr) {
      console.error("profiles error:", profilesErr);
      throw profilesErr;
    }

    console.log(`Found ${profiles?.length || 0} eligible users`);

    let sent = 0;
    for (const profile of profiles || []) {
      try {
        // Get user email from auth
        const { data: authData } = await supabase.auth.admin.getUserById(profile.user_id);
        const email = authData?.user?.email;
        if (!email) continue;

        // Check if user has meals this week
        const { count: mealCount } = await supabase
          .from("meal_entries")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profile.user_id)
          .gte("created_at", weekStartISO);

        if (!mealCount || mealCount === 0) continue;

        // Collect week data
        const [mealsRes, savingsRes, recipesRes, goalsRes] = await Promise.all([
          supabase
            .from("meal_entries")
            .select("total_calories, total_protein")
            .eq("user_id", profile.user_id)
            .gte("created_at", weekStartISO),
          supabase
            .from("savings_log")
            .select("amount")
            .eq("user_id", profile.user_id)
            .gte("created_at", weekStartISO),
          supabase
            .from("meal_entries")
            .select("id", { count: "exact", head: true })
            .eq("user_id", profile.user_id)
            .not("recipe_id", "is", null)
            .gte("created_at", weekStartISO),
          supabase
            .from("user_goals")
            .select("daily_calories_target, goals")
            .eq("user_id", profile.user_id)
            .maybeSingle(),
        ]);

        const meals = mealsRes.data || [];
        const avgCalories = meals.length
          ? Math.round(meals.reduce((s, m) => s + (m.total_calories || 0), 0) / 7)
          : 0;
        const avgProtein = meals.length
          ? Math.round(meals.reduce((s, m) => s + Number(m.total_protein || 0), 0) / 7)
          : 0;
        const moneySaved = (savingsRes.data || [])
          .reduce((s, r) => s + Number(r.amount || 0), 0)
          .toFixed(2);

        // Detect language: check user_metadata first, then profile city-based heuristic, default to ru
        const lang = authData?.user?.user_metadata?.language || "ru";

        const weekData = {
          avgCalories,
          avgProtein,
          mealsLogged: meals.length,
          streak: profile.streak_current || 0,
          moneySaved,
          itemsUsed: 0, // approximate
          recipesCooked: recipesRes.count || 0,
          calorieTarget: goalsRes.data?.daily_calories_target || 2000,
          goal: (goalsRes.data?.goals as string[])?.[0] || "",
        };

        // Call send-weekly-report function
        const fnUrl = `${supabaseUrl}/functions/v1/send-weekly-report`;
        await fetch(fnUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            name: profile.display_name || email.split("@")[0],
            language: lang,
            weekData,
          }),
        });

        sent++;
      } catch (userErr) {
        console.error(`Error for user ${profile.user_id}:`, userErr);
      }
    }

    console.log(`Weekly reports sent: ${sent}`);
    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weekly-report-scheduler error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
