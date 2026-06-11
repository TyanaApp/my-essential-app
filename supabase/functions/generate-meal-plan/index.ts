import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Try to repair truncated JSON by closing open brackets/braces
function repairJson(text: string): string {
  let s = text.trim();
  // Remove trailing comma
  s = s.replace(/,\s*$/, '');
  
  // Count open/close brackets
  let braces = 0, brackets = 0;
  let inString = false, escape = false;
  for (const ch of s) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') braces++;
    if (ch === '}') braces--;
    if (ch === '[') brackets++;
    if (ch === ']') brackets--;
  }
  
  // Close unclosed strings
  if (inString) s += '"';
  
  // Remove trailing partial key-value
  s = s.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}[\]]*$/, '');
  s = s.replace(/,\s*$/, '');
  
  // Close brackets/braces
  for (let i = 0; i < brackets; i++) s += ']';
  for (let i = 0; i < braces; i++) s += '}';
  
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    // Pro-only feature
    const { requirePaidPlan } = await import("../_shared/plan-check.ts");
    const planCheck = await requirePaidPlan(req, {
      cors: corsHeaders,
      requiredTiers: ["pro", "pro_founding"],
    });
    if (!planCheck.ok) return planCheck.response;

  try {
    const body = await req.json();
    const { profile, goals, inventory, familyMembers, language, weekStartDate } = body;

    console.log("generate-meal-plan called, language:", language);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    const calories = goals?.daily_calories_target || 2000;
    const dietType = goals?.diet_type || 'omnivore';
    const allergies = goals?.allergies?.join(', ') || 'none';
    const goalType = goals?.goals?.join(', ') || 'healthy eating';
    const householdSize = familyMembers?.length || goals?.household_size || 1;
    const disliked = goals?.disliked_foods?.join(', ') || 'none';
    const name = profile?.display_name || 'User';

    const inventoryList = (inventory || [])
      .slice(0, 15)
      .map((i: any) => `${i.name}`)
      .join(', ') || 'basic products';

    const startDate = weekStartDate || new Date().toISOString().split('T')[0];
    const dates: string[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Prompt requiring structured ingredients with amounts
    const userPrompt = `Create a 7-day meal plan. Respond in ${lang}. Return ONLY valid JSON, no markdown.

Person: ${name}, Goal: ${goalType}, ${calories} kcal/day, Diet: ${dietType}, Allergies: ${allergies}, Dislikes: ${disliked}, Household: ${householdSize}
Available: ${inventoryList}

CRITICAL RULES:
- Keep max 5 ingredients per meal. Keep cookTime short like "15м" or "15m". Keep meal names short.
- Every ingredient MUST have "name", "amount" (number), and "unit" (г/мл/шт/ст.л/ч.л).
- Amounts must be realistic and match the KBJU values. Never omit amounts.
- Include "steps" array with 3-5 short cooking steps per meal.

Return exactly this JSON structure:
{"days":[{"date":"${dates[0]}","dayName":"day name","meals":{"breakfast":{"name":"meal","emoji":"🥣","calories":350,"protein":15,"fat":8,"carbs":55,"ingredients":[{"name":"Oatmeal","amount":80,"unit":"g"},{"name":"Milk","amount":200,"unit":"ml"}],"steps":["Step 1","Step 2"],"cookTime":"10м","fromInventory":true},"lunch":{"name":"meal","emoji":"🍲","calories":500,"protein":30,"fat":15,"carbs":60,"ingredients":[{"name":"Chicken","amount":200,"unit":"g"},{"name":"Rice","amount":80,"unit":"g"}],"steps":["Step 1","Step 2"],"cookTime":"20м","fromInventory":false},"dinner":{"name":"meal","emoji":"🍗","calories":450,"protein":35,"fat":16,"carbs":40,"ingredients":[{"name":"Fish","amount":180,"unit":"g"}],"steps":["Step 1","Step 2"],"cookTime":"25м","fromInventory":true},"snack":{"name":"snack","emoji":"🍎","calories":150,"protein":5,"fat":3,"carbs":20,"ingredients":[{"name":"Apple","amount":1,"unit":"pcs"}],"steps":["Wash and eat"],"cookTime":"0м","fromInventory":true}},"dayTotal":{"calories":1450,"protein":85,"fat":42,"carbs":175}}],"weekSummary":{"avgCalories":${calories},"avgProtein":100,"avgFat":65,"avgCarbs":250},"shoppingList":[{"name":"product","amount":"500g"}]}

Generate ALL 7 days: ${dates.map((d) => `${d}`).join(', ')}
Each day total should be close to ${calories} kcal.`;

    console.log("Calling AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `You are a nutritionist. Return ONLY compact valid JSON. No markdown, no code blocks, no extra text. Respond in ${lang}. Keep all string values short and concise.` },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 16000,
        temperature: 0.7,
      }),
    });

    console.log("AI status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: response.status === 429 ? 429 : response.status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";
    const finishReason = aiData.choices?.[0]?.finish_reason || "unknown";

    console.log("Response length:", rawText.length, "finish_reason:", finishReason);

    if (!rawText) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean markdown
    let cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Extract JSON
    const jsonStart = cleaned.indexOf('{');
    if (jsonStart === -1) {
      console.error("No JSON found");
      return new Response(JSON.stringify({ error: "No JSON in response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let jsonStr = cleaned.substring(jsonStart);
    let plan: any;

    // Try parsing directly first
    try {
      plan = JSON.parse(jsonStr);
    } catch (e1) {
      console.log("Direct parse failed, attempting repair...");
      // Try repairing truncated JSON
      try {
        const repaired = repairJson(jsonStr);
        plan = JSON.parse(repaired);
        console.log("Repair succeeded");
      } catch (e2) {
        // Last resort: try to extract partial plan with at least some days
        console.error("Repair failed:", e2);
        
        // Try to find and parse just the days array
        try {
          const daysMatch = jsonStr.match(/"days"\s*:\s*\[/);
          if (daysMatch) {
            const daysStart = jsonStr.indexOf(daysMatch[0]);
            let partial = jsonStr.substring(daysStart + daysMatch[0].length - 1);
            partial = repairJson(partial);
            const daysArr = JSON.parse(partial);
            if (Array.isArray(daysArr) && daysArr.length > 0) {
              plan = { days: daysArr, weekSummary: { avgCalories: calories }, shoppingList: [] };
              console.log("Partial recovery: got", daysArr.length, "days");
            }
          }
        } catch {
          return new Response(JSON.stringify({ error: "Failed to parse meal plan" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    if (!plan?.days?.length) {
      return new Response(JSON.stringify({ error: "Empty plan" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Success:", plan.days.length, "days");

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-meal-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
