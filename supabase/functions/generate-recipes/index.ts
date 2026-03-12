import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SNACK_WORDS = [
  'печенье', 'cookie', 'biscuit', 'cookies', 'biscuits',
  'чипсы', 'chips', 'crackers', 'крекер',
  'шоколад', 'chocolate', 'candy', 'конфет',
  'снек', 'snack', 'вафли', 'пряник',
  'зефир', 'мармелад', 'карамель',
  'батончик', 'bar', 'twix', 'kit kat', 'oreo', 'digestive',
  'нутс', 'nuts bar',
  'cepumi', 'čipsi', 'šokolāde', 'konfektes',
  'печиво', 'цукерки', 'вафлі',
];

function isPackagedSnack(name: string): boolean {
  const lower = name.toLowerCase();
  return SNACK_WORDS.some(w => lower.includes(w));
}

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
      inventory,
      userGoals,
      language,
      familyMembers,
      previousRecipes,
      excludeRecipes,
    } = await req.json();

    const langMap: Record<string, string> = { ru: 'Russian', lv: 'Latvian', en: 'English', uk: 'Ukrainian' };
    const lang = langMap[language] || 'English';

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Separate cookable ingredients from packaged snacks
    const today = new Date().toISOString().split('T')[0];
    const freshInventory = (inventory || []).filter((i: any) => !i.expires_at || i.expires_at >= today);
    
    const cookableItems = freshInventory.filter((i: any) => !isPackagedSnack(i.name));
    const snackItems = freshInventory.filter((i: any) => isPackagedSnack(i.name));

    const expiredItems = (inventory || [])
      .filter((i: any) => i.expires_at && i.expires_at < today)
      .map((i: any) => i.name).join(", ");

    // Combine all previous/excluded recipes
    const allExcluded = [
      ...(previousRecipes || []),
      ...(excludeRecipes || []).map((n: string) => n.toLowerCase()),
    ];

    // Determine recipe count based on available ingredients
    const hasFewIngredients = cookableItems.length < 3;
    const nowCount = cookableItems.length === 0 ? 0 : hasFewIngredients ? 2 : 3;
    const buyCount = hasFewIngredients ? 3 : 3;
    const totalCount = nowCount + buyCount;

    // Build ingredient list as bullet points for clarity
    const ingredientList = cookableItems.length > 0
      ? cookableItems.map((i: any) => `- ${i.name}: ${i.quantity} ${i.unit}`).join('\n')
      : '(nothing cookable)';

    const snackList = snackItems.length > 0
      ? snackItems.map((i: any) => `- ${i.name}`).join('\n')
      : '(none)';

    const allergies = (userGoals?.allergies || []).join(", ") || "none";
    const dislikedFoods = (userGoals?.disliked_foods || []).join(", ") || "none";

    const familySection = (familyMembers && familyMembers.length > 0) ? `
Family members (must be safe for ALL):
${familyMembers.map((m: any) => 
  `- ${m.name}: age ${m.age || '?'}, allergies: ${(m.allergies || []).join(', ') || 'none'}, diet: ${m.diet_type || 'omnivore'}`
).join('\n')}` : '';

    const prompt = `You are a practical home cooking assistant. Respond ENTIRELY in ${lang}.

REAL INGREDIENTS the user can cook with:
${ingredientList}

PACKAGED SNACKS (eat as-is, NOT for cooking):
${snackList}
CRITICAL: These are WHOLE finished products. "Печенье с яблоками и корицей" is ONE cookie product — it does NOT contain apples or cinnamon as separate ingredients. NEVER extract or invent ingredients from packaged product names. NEVER use packaged snacks as recipe ingredients.

ALREADY SHOWN (do NOT repeat): ${allExcluded.length > 0 ? allExcluded.join(', ') : 'none'}
EXPIRED (NEVER use): ${expiredItems || 'none'}
ALLERGIES (NEVER include): ${allergies}
DISLIKED foods (NEVER use): ${dislikedFoods}
${familySection}

Cooking for: ${cookingFor || 1} people
Meal type: ${mealType || 'any'}
Time: ${timeAvailable || 'any'}
Diet: ${userGoals?.diet_type || 'omnivore'}
Daily calories: ${userGoals?.daily_calories_target || 2000} kcal

RULES:
1. Only use ingredients EXPLICITLY listed above as real ingredients
2. NEVER invent or hallucinate ingredients not in the list
3. NEVER decompose packaged products into components
4. If very few ingredients → suggest simple honest recipes (omelette, fried eggs, toast, etc.)
5. Each recipe must be genuinely different (different main ingredient, different method)
${hasFewIngredients ? '6. User has very few ingredients — be honest, suggest only what is genuinely possible' : ''}

Generate ${totalCount} recipes:
${nowCount > 0 ? `- ${nowCount} for category "now": use ONLY listed real ingredients` : '- 0 for category "now" (no cookable ingredients)'}
- ${buyCount} for category "buy": use listed ingredients + 1-3 extra items to purchase (show what to buy, keep under €5)

Return ONLY a valid JSON array (no markdown, no code fences):
[{
  "category": "now" or "buy",
  "title": "Recipe name in ${lang}",
  "imageQuery": "english food name 2-4 words",
  "ingredients": [{"name":"in ${lang}","amount":"qty","inFridge":true/false}],
  "missingIngredients": ["items to buy in ${lang}"],
  "estimatedShoppingCost": 0,
  "instructions": ["step1","step2"],
  "nutrition": {"calories":400,"protein":25,"fat":12,"carbs":45},
  "prepTime": 20,
  "estimatedCost": 3.50
}]

"imageQuery" MUST be in English. "inFridge"=true if from inventory, false if to buy. "missingIngredients" empty for "now" category.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.85,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again later" }), {
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

    return new Response(JSON.stringify({ recipes, fewIngredients: hasFewIngredients }), {
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
