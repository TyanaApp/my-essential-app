import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { profile, goals, inventory, familyMembers, language, weekStartDate } = body;

    console.log("generate-meal-plan called, language:", language);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    // Safe defaults
    const calories = goals?.daily_calories_target || 2000;
    const dietType = goals?.diet_type || 'omnivore';
    const allergies = goals?.allergies?.join(', ') || 'none';
    const goalType = goals?.goals?.join(', ') || 'healthy eating';
    const householdSize = familyMembers?.length || goals?.household_size || 1;
    const disliked = goals?.disliked_foods?.join(', ') || 'none';
    const name = profile?.display_name || 'User';

    const inventoryList = (inventory || [])
      .slice(0, 20)
      .map((i: any) => `${i.name}: ${i.quantity || 1}${i.unit || 'pcs'} (exp: ${i.expires_at || 'n/a'})`)
      .join('\n') || 'basic products (eggs, grains, vegetables, meat)';

    const familyList = (familyMembers || [])
      .map((m: any) => `${m.name} age ${m.age || '?'} allergies:${m.allergies?.join(',') || 'none'}`)
      .join('; ') || 'just one person';

    // Calculate dates
    const startDate = weekStartDate || new Date().toISOString().split('T')[0];
    const dates: string[] = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const systemPrompt = `You are a professional nutritionist creating personalized meal plans.
Respond entirely in ${lang}.
Return ONLY valid JSON. No text outside JSON. No markdown. No asterisks. No code blocks.`;

    const userPrompt = `Create a 7-day meal plan for ${name}.

PERSON: Age ${goals?.age || '?'}, Gender ${profile?.gender || '?'}, Weight ${goals?.weight_kg || '?'}kg, Height ${goals?.height_cm || '?'}cm
Activity: ${goals?.activity_level || 'moderate'}
Goal: ${goalType}
Calories: ${calories} kcal/day
Diet: ${dietType}
Allergies: ${allergies}
Dislikes: ${disliked}
Household: ${householdSize} people
Family: ${familyList}

AVAILABLE FOOD:
${inventoryList}

RULES:
1. Each day: breakfast + lunch + dinner + snack
2. Daily total within ±150 kcal of ${calories}
3. No repeated meals in 7 days
4. Prioritize expiring items first
5. Mark fromInventory: true if all ingredients available
6. List missingIngredients if shopping needed
7. Scale for ${householdSize} people
8. Weekend meals can be more elaborate

Return this exact JSON:
{
  "days": [
    {
      "date": "${dates[0]}",
      "dayName": "day name in ${lang}",
      "meals": {
        "breakfast": {
          "name": "meal name",
          "emoji": "🥣",
          "calories": 350,
          "protein": 15,
          "fat": 8,
          "carbs": 55,
          "ingredients": ["ingredient 1", "ingredient 2"],
          "cookTime": "10 min",
          "fromInventory": true,
          "missingIngredients": []
        },
        "lunch": { ...same structure },
        "dinner": { ...same structure },
        "snack": { ...same structure }
      },
      "dayTotal": { "calories": 1950, "protein": 98, "fat": 62, "carbs": 245 }
    }
  ],
  "weekSummary": {
    "avgCalories": 1950,
    "avgProtein": 96,
    "avgFat": 63,
    "avgCarbs": 242,
    "daysFromInventory": 4,
    "estimatedShoppingCost": 25
  },
  "shoppingList": [
    { "name": "product", "amount": "500g", "forDays": ["Mon", "Fri"] }
  ]
}

Generate ALL 7 days with these dates:
${dates.map((d, i) => `Day ${i + 1}: ${d}`).join('\n')}`;

    console.log("Calling AI gateway for meal plan...");

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

    console.log("AI gateway status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
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
      return new Response(JSON.stringify({ error: `AI error: ${response.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const rawText = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response length:", rawText.length);
    console.log("AI response preview:", rawText.substring(0, 300));

    if (!rawText) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggressive JSON extraction
    let cleaned = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*[\r\n]+/gm, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found:", cleaned.substring(0, 500));
      return new Response(JSON.stringify({ error: "Failed to parse meal plan" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let plan: any;
    try {
      plan = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      // Try fixing common issues
      const fixed = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/'/g, '"');
      try {
        plan = JSON.parse(fixed);
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse meal plan JSON" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
      console.error("Empty plan generated:", JSON.stringify(plan).substring(0, 300));
      return new Response(JSON.stringify({ error: "Empty plan generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Plan generated successfully, days:", plan.days.length);

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
