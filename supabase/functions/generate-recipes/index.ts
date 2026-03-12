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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
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
    
    const cookableList = cookableItems.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(", ");
    const snackList = snackItems.map((i: any) => i.name).join(", ");

    const expiredItems = (inventory || [])
      .filter((i: any) => i.expires_at && i.expires_at < today)
      .map((i: any) => i.name).join(", ");

    const dislikedFoods = (userGoals?.disliked_foods || []).join(", ");
    const familyDislikes = (userGoals?.family_dislikes || []).join(", ");

    // Combine all previous/excluded recipes
    const allExcluded = [
      ...(previousRecipes || []),
      ...(excludeRecipes || []).map((n: string) => n.toLowerCase()),
    ];

    const prompt = `YOU MUST respond ENTIRELY in ${lang}. 
ALL fields must be in ${lang}: title, ingredients names, instructions, units.
DO NOT use English if language is not English. This is critical.

You are TYANA smart recipe assistant.

═══ USER'S COOKABLE INGREDIENTS ═══
${cookableList || 'Nothing cookable available'}

═══ PACKAGED SNACKS (NOT for cooking, eating as-is) ═══
${snackList || 'None'}

CRITICAL RULE about packaged products:
Cookies, biscuits, crackers, chips, candy, chocolate bars, packaged snacks are WHOLE products for eating as-is.
NEVER use them as ingredient sources.
NEVER suggest cutting up cookies or extracting ingredients from packaged foods.
NEVER suggest using cookie crumbs unless it's a specific no-bake dessert that explicitly calls for them.

═══ PREVIOUSLY SHOWN RECIPES (DO NOT REPEAT) ═══
${allExcluded.length > 0 ? allExcluded.join(', ') : 'None'}
If you find yourself suggesting any of these → choose a completely different dish.

═══ USER SETTINGS ═══
Daily calorie target: ${userGoals?.daily_calories_target || 2000} kcal
Diet: ${userGoals?.diet_type || "omnivore"}
Allergies - NEVER include: ${(userGoals?.allergies || []).join(", ") || "none"}
Cooking for: ${cookingFor || 1} people
Meal type: ${mealType || "any"}
Time available: ${timeAvailable || "any"}
Primary goals: ${(userGoals?.goals || []).join(", ") || "balanced eating"}
Household size: ${userGoals?.household_size || 1}

${(familyMembers && familyMembers.length > 0) ? `
FAMILY MEMBERS:
${familyMembers.map((m: any) => 
  `- ${m.name}: age ${m.age || 'unknown'}, allergies: ${(m.allergies || []).join(', ') || 'none'}, diet: ${m.diet_type || 'omnivore'}`
).join('\n')}
MUST be safe for ALL family members. If child under 12 → avoid very spicy food.
` : ''}

FOOD RESTRICTIONS - NEVER VIOLATE:
- NEVER use DISLIKED foods: ${dislikedFoods || "none"}
- NEVER use FAMILY DISLIKES: ${familyDislikes || "none"}
- NEVER use ALLERGENS: ${(userGoals?.allergies || []).join(", ") || "none"}
${(familyMembers && familyMembers.length > 0) ? `- NEVER include allergens from ANY family member: ${familyMembers.flatMap((m: any) => m.allergies || []).join(', ') || 'none'}` : ''}
- EXPIRED items (NEVER use): ${expiredItems || "none"}

═══ GENERATE 6 DIVERSE RECIPES IN TWO CATEGORIES ═══

CATEGORY A - "now" (3 recipes): Cook right now from available cookable ingredients ONLY.
- Use ONLY ingredients from the cookable list above
- Do NOT use packaged snacks as ingredients
- If very few cookable ingredients → suggest simple dishes (omelette, fried eggs, etc.)

CATEGORY B - "buy" (3 recipes): Need 1-3 extra ingredients to buy.
- Can use available cookable ingredients + 1-3 additional items to purchase
- Show exactly what needs to be bought with estimated cost
- Keep extra shopping affordable

${cookableItems.length === 0 ? `User has NO cookable ingredients! For Category A: suggest 0 recipes. For Category B: suggest 6 recipes requiring 3-5 basic items to buy.` : ''}

DIVERSITY RULES:
- No two recipes with the same main ingredient
- Mix different meal types (breakfast/lunch/dinner/snack)
- Different cooking methods
- Each recipe must be genuinely different

Return ONLY a valid JSON array (no markdown, no code fences):
[{
  "category": "now" or "buy",
  "title": "Recipe name in ${lang}",
  "imageQuery": "english food name for photo search 2-4 words",
  "ingredients": [{"name":"ingredient in ${lang}","amount":"quantity string","inFridge":true}],
  "missingIngredients": ["item1 in ${lang}", "item2"],
  "estimatedShoppingCost": 0,
  "instructions": ["step1","step2"],
  "nutrition": {"calories":400,"protein":25,"fat":12,"carbs":45},
  "prepTime": 20,
  "estimatedCost": 3.50
}]

IMPORTANT: 
- "imageQuery" MUST always be in English (e.g. "chicken caesar salad")
- "inFridge" = true if ingredient is from user's inventory, false if needs to be bought
- "missingIngredients" = list of items NOT in inventory (empty for "now" category)
- "estimatedShoppingCost" = cost of missing ingredients only (0 for "now" category)
- For "buy" category: include estimated cost per missing ingredient in a reasonable local currency`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.9,
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
