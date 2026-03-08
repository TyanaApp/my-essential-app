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
    // Auth check
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      mealType,
      cookingFor,
      timeAvailable,
      useOnlyInventory,
      inventory,
      userGoals,
      language,
      familyMembers,
    } = await req.json();

    const langMap: Record<string, string> = { ru: 'Russian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dislikedFoods = (userGoals?.disliked_foods || []).join(", ");
    const familyDislikes = (userGoals?.family_dislikes || []).join(", ");

    const today = new Date().toISOString().split('T')[0];
    const expiredItems = (inventory || [])
      .filter((i: any) => i.expires_at && i.expires_at < today)
      .map((i: any) => i.name)
      .join(", ");

    const freshInventory = (inventory || [])
      .filter((i: any) => !i.expires_at || i.expires_at >= today);

    const inventoryList = freshInventory
      .map((i: any) => `${i.name} ${i.quantity}${i.unit}`)
      .join(", ");

    const prompt = `YOU MUST respond ENTIRELY in ${lang}. 
ALL fields must be in ${lang}: title, ingredients names, instructions, units.
DO NOT use English if language is not English.
This is critical.

You are TYANA kitchen assistant. Generate 3 recipes.
User has these ingredients at home: ${inventoryList}
Daily calorie target: ${userGoals?.daily_calories_target || 2000} kcal
Diet: ${userGoals?.diet_type || "omnivore"}
Allergies - NEVER include these allergens: ${(userGoals?.allergies || []).join(", ") || "none"}
Cooking for: ${cookingFor || 1} people
Meal type: ${mealType || "any"}
Time available: ${timeAvailable || "any"}
Use only available ingredients: ${useOnlyInventory ? "yes" : "no"}
Primary goals: ${(userGoals?.goals || []).join(", ") || "balanced eating"}
Household size: ${userGoals?.household_size || 1} people (adjust portions accordingly)

${(familyMembers && familyMembers.length > 0) ? `
FAMILY MEMBERS AND THEIR RESTRICTIONS:
${familyMembers.map((m: any) => 
  `- ${m.name}: age ${m.age || 'unknown'}, allergies: ${(m.allergies || []).join(', ') || 'none'}, diet: ${m.diet_type || 'omnivore'}`
).join('\n')}
Generate recipe for ${familyMembers.length} people.
MUST be safe for ALL family members - no allergens for anyone.
Adjust portions for ${familyMembers.length} servings.
If child under 12 in family → avoid very spicy food.
` : ''}

CRITICAL FOOD RESTRICTIONS - NEVER VIOLATE:
- NEVER suggest recipes containing these DISLIKED foods: ${dislikedFoods || "none"}
- NEVER suggest recipes containing these FAMILY DISLIKES: ${familyDislikes || "none"}  
- NEVER suggest recipes containing these ALLERGENS: ${(userGoals?.allergies || []).join(", ") || "none"}
${(familyMembers && familyMembers.length > 0) ? `- NEVER include allergens from ANY family member: ${familyMembers.flatMap((m: any) => m.allergies || []).join(', ') || 'none'}` : ''}
- CRITICAL: These items are EXPIRED (past expiry date): ${expiredItems || "none"}
  NEVER include expired items in recipes. NEVER suggest cooking expired food.
  Only use items that are fresh or within expiry date.
Violating food preferences destroys user trust. Double-check every ingredient.

Return ONLY a valid JSON array of 3 recipes, no markdown or code fences:
[{"title":"string","imageQuery":"english food name for photo search e.g. chicken fried rice","ingredients":[{"name":"string","amount":"string","inFridge":true}],"instructions":["step1","step2"],"nutrition":{"calories":400,"protein":25,"fat":12,"carbs":45},"prepTime":20,"estimatedCost":3.50,"familySafe":true,"familyWarnings":[]}]
IMPORTANT: "imageQuery" MUST always be in English regardless of language setting. It should be 2-4 words describing the dish for image search (e.g. "chicken caesar salad", "beef stroganoff", "mushroom risotto").`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let recipes = [];

    try {
      const text = data.choices?.[0]?.message?.content || "[]";
      recipes = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      recipes = [];
    }

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-recipes error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
