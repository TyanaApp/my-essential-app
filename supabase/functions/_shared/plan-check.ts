// Shared subscription enforcement helper for paid edge functions.
// Returns { ok: true, userId, plan, status } when the caller is allowed,
// or { ok: false, response } with a ready-to-return Response on failure.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

type CorsHeaders = Record<string, string>;

export type Tier = "free" | "lite" | "pro" | "pro_founding";

const PAID_TIERS: Tier[] = ["lite", "pro", "pro_founding"];

export interface PlanCheckOk {
  ok: true;
  userId: string;
  plan: Tier;
  status: string;
  trialEnd: string | null;
}

export interface PlanCheckErr {
  ok: false;
  response: Response;
}

export type PlanCheckResult = PlanCheckOk | PlanCheckErr;

interface RequireOpts {
  cors: CorsHeaders;
  // Minimum tier required. Defaults to any paid tier (lite or higher).
  requiredTiers?: Tier[];
  // If true, active 7-day trials count as paid.
  allowTrial?: boolean;
}

export async function requirePaidPlan(
  req: Request,
  { cors, requiredTiers = PAID_TIERS, allowTrial = true }: RequireOpts,
): Promise<PlanCheckResult> {
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
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims?.sub) {
    return { ok: false, response: unauthorized() };
  }
  const userId = claimsData.claims.sub as string;

  // Use service role for the profile lookup so RLS never blocks the gate.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("subscription_plan, subscription_status, trial_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (pErr || !profile) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } },
      ),
    };
  }

  const plan = (profile.subscription_plan ?? "free") as Tier;
  const status = (profile.subscription_status ?? "free") as string;
  const trialEnd = profile.trial_end ?? null;
  const trialActive =
    status === "trial" && trialEnd && new Date(trialEnd) > new Date();

  const planQualifies = requiredTiers.includes(plan);
  const trialQualifies = allowTrial && trialActive;

  if (!planQualifies && !trialQualifies) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: "Subscription required",
          required_tier: requiredTiers[0],
          current_plan: plan,
        }),
        { status: 402, headers: { ...cors, "Content-Type": "application/json" } },
      ),
    };
  }

  return { ok: true, userId, plan, status, trialEnd };
}
