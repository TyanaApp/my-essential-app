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
    const packaged = [
      'печенье','cookie','вафли','крекер','crackers',
      'чипсы','chips','шоколад','chocolate','конфеты',
      'candy','батончик','снек','snack','пряник',
      'зефир','мармелад','карамель','нутс','twix',
      'kitkat','oreo','бисквит','сухарики',
      'cookies','biscuit','biscuits','bar','kit kat',
      'cepumi','čipsi','šokolāde','konfektes',
      'печиво','цукерки','вафлі',
    ];

    const today = new Date().toISOString().split('T')[0];
    const freshInventory = (inventory || []).filter((i: any) => !i.expires_at || i.expires_at >= today);

    const realIngredients = freshInventory.filter((item: any) => {
      return !packaged.some(w => item.name.toLowerCase().includes(w));
    });
    const snacks = freshInventory.filter((item: any) => {
      return packaged.some(w => item.name.toLowerCase().includes(w));
    });

    const allExcluded = [
      ...(previousRecipes || []),
      ...(excludeRecipes || []).map((n: string) => n.toLowerCase()),
    ];

    const allergies = [...(userGoals?.allergies || [])];
    if (familyMembers && familyMembers.length > 0) {
      for (const m of familyMembers) {
        if (m.allergies) allergies.push(...m.allergies);
      }
    }
    const uniqueAllergies = [...new Set(allergies)];
    const dislikedFoods = (userGoals?.disliked_foods || []).join(", ") || "none";
    const dietType = userGoals?.diet_type || 'omnivore';
    const householdSize = cookingFor || userGoals?.household_size || 1;
    const userGoal = (userGoals?.goals || []).join(', ') || 'eat well';

    const prompt = `You are a practical home chef.
Language: ${lang}. 
Respond ONLY in ${lang}.

Cookable ingredients available:
${realIngredients.length > 0 
  ? realIngredients.map((i: any) => `${i.name} — ${i.quantity} ${i.unit}`).join('\n')
  : 'None'}

Packaged snacks (eat as-is, NEVER cook with, NEVER extract ingredients):
${snacks.map((i: any) => i.name).join(', ') || 'None'}

Already shown (do not repeat):
${allExcluded.join(', ') || 'none'}

User goals: ${userGoal}, diet: ${dietType}, ${householdSize} person(s)
Allergies: ${uniqueAllergies.join(', ') || 'none'}
Disliked foods: ${dislikedFoods}
Meal type: ${mealType || 'any'}
Time available: ${timeAvailable || 'any'}
Daily calories target: ${userGoals?.daily_calories_target || 2000} kcal
Household size: ${householdSize} people

STRICT MEAL TYPE RULES - only suggest appropriate dishes:
breakfast → porridge, eggs, toast, smoothie, yogurt, pancakes, omelette
lunch → soup, main course with side dish, salad + protein, pasta, rice dishes, meat/fish + vegetables + carbs
dinner → lighter main course, fish, vegetables, light protein
snack → fruit, nuts, yogurt, small bites

For LUNCH specifically:
- Must include protein (meat/fish/eggs/legumes)
- Must include side dish (rice/pasta/potatoes/grains)
- Must include vegetables
- NEVER suggest pancakes, oatmeal, or typical breakfast foods for lunch
- Think: chicken + rice + salad, pasta bolognese, fish + mashed potato

For DINNER specifically:
- Lighter than lunch
- NEVER suggest heavy breakfast foods like pancakes or oatmeal
- Think: fish + vegetables, chicken salad, light soup

PORTION SCALING:
ALL ingredient amounts must be for ${householdSize} people.
Example for 4 people: Chicken breast: 800g (not 200g), Rice: 320g dry (not 80g).

YOUR TASK:
Generate 6 real, tasty, simple recipes (max 30 min to cook).

STRICT RULES:
1. ONLY use ingredients from cookable list above
2. NEVER invent ingredients not listed
3. NEVER use packaged snacks as ingredients
4. NEVER suggest "eggs with cookies" or similar nonsense
5. Recipes must be genuinely tasty and realistic
6. If ingredients are limited → be honest, suggest simple dishes AND what to buy
7. Assume user has basic seasonings (salt, pepper, oil)

For each recipe:
- "category": "now" (can make immediately) or "buy" (needs 1-3 extra items)
- "title": tasty descriptive name in ${lang}
- "imageQuery": english food name for photo search, 2-4 words
- "servings": ${householdSize}
- "caloriesPerServing": realistic calories for ONE serving (1 person)
- "totalCalories": caloriesPerServing × ${householdSize}
- "nutrition": {"calories": per serving, "protein": per serving, "fat": per serving, "carbs": per serving}
- "prepTime": minutes
- "ingredients": [{"name":"...", "amount":"qty with unit FOR ${householdSize} PEOPLE", "inFridge": true/false}]
- "missingIngredients": ["items to buy in ${lang} with quantities"] (empty for "now")
- "estimatedShoppingCost": cost of missing items in EUR (0 for "now")
- "instructions": ["step1","step2","step3"]
- "estimatedCost": total cost in EUR

If user has almost nothing cookable:
- Generate max 2 "now" recipes
- Generate 4 "buy" recipes with cheap additions
- Be honest: suggest buying basics like bread, milk, vegetables, pasta

NEVER generate:
- Raw ingredient combinations that make no sense
- Dishes that require equipment not mentioned
- Recipes mixing snacks with raw ingredients

Return ONLY a valid JSON array (no markdown, no code fences).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
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
      const cleaned = text.replace(/```json|```/g, "").trim();
      recipes = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse recipes JSON:", data.choices?.[0]?.message?.content);
      recipes = [];
    }

    const hasFewIngredients = realIngredients.length < 3;

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
