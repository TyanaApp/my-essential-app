// Shared server-side AI quota / plan check.
// Free tier: FREE_DAILY_LIMIT gpt calls per day (increments usage_tracking).
// Paid tiers (lite / pro / pro_founding, or active trial): unlimited.
// Returns { ok: true } or { ok: false, response }.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type CorsHeaders = Record<string, string>;

const FREE_DAILY_LIMIT = 3;
const PAID_TIERS = new Set(["lite", "pro", "pro_founding"]);

export interface QuotaOk {
  ok: true;
  userId: string;
  plan: string;
}
export interface QuotaErr {
  ok: false;
  response: Response;
}
export type QuotaResult = QuotaOk | QuotaErr;

export async function enforceAiQuota(
  req: Request,
  { cors, requirePaid = false }: { cors: CorsHeaders; requirePaid?: boolean },
): Promise<QuotaResult> {
  const authHeader = req.headers.get("Authorization");
  const unauthorized = () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, response: unauthorized() };
  }
  const token = authHeader.replace("Bearer ", "");

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: cd, error: ce } = await sb.auth.getClaims(token);
  if (ce || !cd?.claims?.sub) {
    return { ok: false, response: unauthorized() };
  }
  const userId = cd.claims.sub as string;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("subscription_plan, subscription_status, trial_end")
    .eq("user_id", userId)
    .maybeSingle();

  const plan = (profile?.subscription_plan ?? "free") as string;
  const status = (profile?.subscription_status ?? "free") as string;
  const trialEnd = profile?.trial_end ?? null;
  const trialActive =
    status === "trial" && trialEnd && new Date(trialEnd) > new Date();
  const isPaid = PAID_TIERS.has(plan) || trialActive;

  if (requirePaid && !isPaid) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Subscription required", current_plan: plan }),
        { status: 402, headers: { ...cors, "Content-Type": "application/json" } },
      ),
    };
  }

  if (isPaid) {
    return { ok: true, userId, plan };
  }

  // Free tier: enforce daily quota via usage_tracking (service role bypasses RLS).
  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await admin
    .from("usage_tracking")
    .select("gpt_calls_today")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  const used = usage?.gpt_calls_today ?? 0;
  if (used >= FREE_DAILY_LIMIT) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: "Daily AI limit reached",
          limit: FREE_DAILY_LIMIT,
          current_plan: plan,
        }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } },
      ),
    };
  }

  await admin
    .from("usage_tracking")
    .upsert(
      {
        user_id: userId,
        date: today,
        gpt_calls_today: used + 1,
        last_reset_date: today,
      },
      { onConflict: "user_id,date" },
    );

  return { ok: true, userId, plan };
}
