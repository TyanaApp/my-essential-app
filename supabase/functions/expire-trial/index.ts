import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const token = authHeader.replace("Bearer ", "").trim();

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;

    // Check current status
    const { data: profile } = await adminClient
      .from("profiles")
      .select("subscription_status, trial_end")
      .eq("user_id", userId)
      .single();

    if (!profile || profile.subscription_status !== "trial") {
      return new Response(JSON.stringify({ status: "not_on_trial" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trialEnd = new Date(profile.trial_end);
    if (trialEnd > new Date()) {
      return new Response(JSON.stringify({ status: "trial_active", trial_end: profile.trial_end }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Expire trial — downgrade to free. DO NOT delete user data.
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        subscription_plan: "free",
        subscription_status: "free",
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    console.log(`[EXPIRE-TRIAL] Trial expired for user ${userId}`);

    return new Response(JSON.stringify({ status: "expired", plan: "free" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[EXPIRE-TRIAL] Error:", msg);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
