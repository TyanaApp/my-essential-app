import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { userProfile, todayMeals, weekMeals, inventory, userGoals, language, mode } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { ru: "Russian", uk: "Ukrainian", lv: "Latvian", en: "English" };
    const lang = langMap[language] || "English";

    const dislikedFoods = (userGoals?.disliked_foods || []).join(', ');
    const familyDislikes = (userGoals?.family_dislikes || []).join(', ');
    const allergies = (userGoals?.allergies || []).join(', ');

    const restrictionsBlock = `
CRITICAL FOOD RESTRICTIONS - user trust depends on this:
- NEVER mention or suggest foods the user DISLIKES: ${dislikedFoods || 'none'}
- NEVER mention foods the user's FAMILY dislikes: ${familyDislikes || 'none'}
- NEVER mention ALLERGENS: ${allergies || 'none'}
- Diet type: ${userGoals?.diet_type || 'omnivore'}
If suggesting foods, only suggest things compatible with these restrictions.`;

    // Compute macro targets from body data
    const weight = Number(userGoals?.weight_kg) || 70;
    const goals: string[] = userGoals?.goals || [];
    const proteinTarget = goals.includes('gain_muscle') ? Math.round(weight * 2) : Math.round(weight * 1.6);
    const calorieTarget = Number(userGoals?.daily_calories_target) || 2000;
    const fatTarget = Math.round(calorieTarget * 0.25 / 9);
    const carbsTarget = Math.round((calorieTarget - proteinTarget * 4 - fatTarget * 9) / 4);

    // Format today's meals for prompt
    const todayMealsList = (todayMeals || []).map((m: any) =>
      `${m.meal_type || 'meal'}: ${m.name || m.custom_name || 'unnamed'} (${m.calories || m.total_calories || 0}kcal, P:${m.protein || m.total_protein || 0}g F:${m.fat || m.total_fat || 0}g C:${m.carbs || m.total_carbs || 0}g)`
    ).join(', ') || 'nothing logged yet';

    const totalCalToday = (todayMeals || []).reduce((s: number, m: any) => s + Number(m.calories || m.total_calories || 0), 0);
    const totalProtToday = (todayMeals || []).reduce((s: number, m: any) => s + Number(m.protein || m.total_protein || 0), 0);
    const totalFatToday = (todayMeals || []).reduce((s: number, m: any) => s + Number(m.fat || m.total_fat || 0), 0);
    const totalCarbsToday = (todayMeals || []).reduce((s: number, m: any) => s + Number(m.carbs || m.total_carbs || 0), 0);

    const fridgeItems = (inventory || []).slice(0, 15).map((i: any) => i.name).join(', ') || 'unknown';

    let systemPrompt: string;
    let userDataPrompt: string;

    if (mode === 'full') {
      systemPrompt = `You are an expert nutritionist and health coach. Give a detailed nutrition analysis in ${lang}. Structure your response EXACTLY like this with these emoji headers on separate lines:

📊 Overall assessment
(2-3 sentences)

✅ What's going well
(2-3 points, each on new line starting with a dash)

⚠️ What to improve
(2-3 points with specific actions, each on new line starting with a dash)

🍽 Today's recommendations
(what to eat for remaining meals, be specific)

📈 Weekly prediction
(if they continue this way, what happens in 1-2 weeks)

${restrictionsBlock}

CRITICAL RULES:
- Write ONLY in ${lang}. Never mix languages. Never use other languages.
- NO asterisks. NO markdown bold/italic. NO hashtags. NO bullet symbols like • or *.
- Use plain dashes (-) for lists. Use plain text only.
- Be specific, use their actual numbers. Be warm and motivating.`;

      userDataPrompt = `User profile:
- Goal: ${goals.join(', ') || 'not set'}
- Daily calorie target: ${calorieTarget} kcal
- Protein target: ${proteinTarget}g, Fat target: ${fatTarget}g, Carbs target: ${carbsTarget}g
- Diet type: ${userGoals?.diet_type || 'omnivore'}
- Weight: ${weight}kg, Height: ${userGoals?.height_cm || '?'}cm
- Age: ${userGoals?.age || '?'}, Gender: ${userProfile?.gender || '?'}
- Activity: ${userGoals?.activity_level || 'moderate'}

Today's meals: ${todayMealsList}
Total today: ${totalCalToday}/${calorieTarget} kcal, P:${totalProtToday}/${proteinTarget}g, F:${totalFatToday}/${fatTarget}g, C:${totalCarbsToday}/${carbsTarget}g

This week average: Calories ${weekMeals?.avgCalories || 0}kcal, Protein ${weekMeals?.avgProtein || 0}g, Fat ${weekMeals?.avgFat || 0}g, Carbs ${weekMeals?.avgCarbs || 0}g

In their fridge: ${fridgeItems}`;
    } else {
      systemPrompt = `You are the world's best personal nutritionist - better than any human nutritionist because you have complete data about this specific person and analyze it deeply every single day.

You write ONLY in ${lang}. Never mix languages. Never use any other language.

CRITICAL FORMAT RULES:
- NO asterisks ever. NO markdown. NO bold. NO italic markers. NO hashtags. NO bullet symbols.
- Write in plain prose paragraphs only.
- Write in warm, personal, direct tone - like a brilliant friend who happens to be a top nutritionist.
- Be SPECIFIC with numbers. Be PERSONAL. Make the person feel truly seen and understood.
- Maximum 5 sentences total.

${restrictionsBlock}`;

      userDataPrompt = `Analyze this person deeply and give personalized nutrition advice.

PERSONAL DATA:
Weight: ${weight}kg, Height: ${userGoals?.height_cm || '?'}cm
Age: ${userGoals?.age || '?'}, Gender: ${userProfile?.gender || '?'}
Activity: ${userGoals?.activity_level || 'moderate'}
Goals: ${goals.join(', ') || 'not set'}
Diet type: ${userGoals?.diet_type || 'omnivore'}
Allergies: ${allergies || 'none'}
Daily calorie target: ${calorieTarget} kcal
Protein target: ${proteinTarget}g, Fat target: ${fatTarget}g, Carbs target: ${carbsTarget}g

TODAY SO FAR:
Meals logged: ${todayMealsList}
Total calories today: ${totalCalToday} / ${calorieTarget}
Total protein today: ${totalProtToday}g / ${proteinTarget}g
Total fat today: ${totalFatToday}g / ${fatTarget}g
Total carbs today: ${totalCarbsToday}g / ${carbsTarget}g

LAST 7 DAYS AVERAGE:
Avg calories: ${weekMeals?.avgCalories || 0}kcal, Avg protein: ${weekMeals?.avgProtein || 0}g

WHAT'S IN THEIR FRIDGE RIGHT NOW:
${fridgeItems}

Now write ONE powerful personalized insight. Structure:

1. OBSERVATION (1-2 sentences): Notice something SPECIFIC about their data today or this week. Reference actual numbers.

2. WHY IT MATTERS (1 sentence): Explain why this is important FOR THEIR SPECIFIC GOAL.

3. SPECIFIC ACTION (1-2 sentences): Tell them EXACTLY what to do using what they HAVE in fridge right now.

4. MOTIVATIONAL CLOSER (1 sentence, warm and personal).

RULES:
- Write entirely in ${lang}
- No asterisks, no bullet symbols, no markdown, no bold markers
- No generic advice - every sentence must reference their actual numbers or actual food
- Maximum 5 sentences total
- Sound like a brilliant caring friend, not a robot
- If they have no data today, focus on weekly pattern`;
    }

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
          { role: "user", content: userDataPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
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
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const advice = data.choices?.[0]?.message?.content || "";

    // Clean any accidental asterisks, markdown, or formatting
    const cleaned = advice
      .replace(/\*+/g, '')
      .replace(/#+\s?/g, '')
      .replace(/_{2,}/g, '')
      .replace(/`+/g, '')
      .trim();

    return new Response(JSON.stringify({
      advice: cleaned,
      generatedAt: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nutrition-advice error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
