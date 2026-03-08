import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, goals, inventory, familyMembers, language, weekStartDate } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    const householdSize = familyMembers?.length || goals?.household_size || 1;
    const calorieTarget = goals?.daily_calories_target || 2000;

    const inventoryList = (inventory || [])
      .map((i: any) => `${i.name}: ${i.quantity || 1}${i.unit || 'pcs'} (expires: ${i.expires_at || 'no date'})`)
      .join('\n');

    const familyList = (familyMembers || [])
      .map((m: any) => `${m.name} age ${m.age || '?'} allergies:${m.allergies?.join(',') || 'none'}`)
      .join('; ') || 'just one person';

    const systemPrompt = `You are the world's best meal planning nutritionist.
You create highly personalized weekly meal plans that:
- Match exact calorie and macro targets
- Use ingredients the person already has at home
- Respect all allergies and dietary restrictions
- Fit the person's goals precisely
- Scale correctly for household size
- Feel varied and enjoyable, not repetitive
- Are realistic to cook (consider cook time, complexity)
- Respond entirely in ${lang}
- Return ONLY valid JSON, no text outside JSON
- No asterisks, no markdown`;

    const userPrompt = `Create a complete 7-day meal plan starting from ${weekStartDate}.

PERSON DATA:
Name: ${profile?.display_name || 'User'}
Age: ${goals?.age || '?'}, Gender: ${profile?.gender || '?'}
Weight: ${goals?.weight_kg || '?'}kg, Height: ${goals?.height_cm || '?'}cm
Activity: ${goals?.activity_level || 'moderate'}
Goal: ${goals?.goals?.join(', ') || 'healthy eating'}
Daily calorie target: ${calorieTarget} kcal
Diet type: ${goals?.diet_type || 'omnivore'}
Allergies: ${goals?.allergies?.join(', ') || 'none'}
Disliked foods: ${goals?.disliked_foods?.join(', ') || 'none'}
Family dislikes: ${goals?.family_dislikes?.join(', ') || 'none'}
Household size: ${householdSize} people
Family members: ${familyList}

AVAILABLE INVENTORY:
${inventoryList || 'No items'}

PLANNING RULES:
1. Prioritize expiring items first - use them in first 2-3 days
2. Each day: breakfast + lunch + dinner + snack
3. Each day total must be within ±100 kcal of target (${calorieTarget} kcal)
4. No meal repeated more than once in 7 days
5. Breakfast: quick (under 10 min on weekdays)
6. Vary cuisines
7. Mark fromInventory: true if ALL ingredients available at home
8. List missingIngredients if some are needed from shop
9. Scale ALL ingredient amounts for ${householdSize} people
10. Must respect ALL allergies for ALL family members
11. Weekend meals can be more elaborate

Return this exact JSON structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayName": "day name in ${lang}",
      "meals": {
        "breakfast": {
          "name": "meal name",
          "emoji": "🥣",
          "calories": 350,
          "protein": 15,
          "fat": 8,
          "carbs": 55,
          "ingredients": ["ingredient 1 amount", "ingredient 2 amount"],
          "cookTime": "10 min",
          "difficulty": "easy",
          "fromInventory": true,
          "missingIngredients": []
        },
        "lunch": {...same structure},
        "dinner": {...same structure},
        "snack": {...same structure}
      },
      "dayTotal": {
        "calories": 1950,
        "protein": 98,
        "fat": 62,
        "carbs": 245
      }
    }
  ],
  "weekSummary": {
    "avgCalories": 1940,
    "avgProtein": 96,
    "avgFat": 63,
    "avgCarbs": 242,
    "daysFromInventory": 4,
    "estimatedShoppingCost": 25
  },
  "shoppingList": [
    {
      "name": "ingredient name",
      "amount": "500g",
      "category": "meat|dairy|produce|grains|other",
      "forDays": ["Mon", "Fri"],
      "forMeals": ["lunch", "dinner"]
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";

    let plan = {};
    try {
      const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      plan = JSON.parse(cleaned);
    } catch (e) {
      console.error("JSON parse error:", e, "Raw text:", text.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse meal plan" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
