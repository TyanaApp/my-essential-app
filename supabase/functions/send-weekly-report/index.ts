import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, language, weekData } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate AI summary
    let aiSummary = "";
    if (LOVABLE_API_KEY) {
      try {
        const langMap: Record<string, string> = { ru: "Russian", uk: "Ukrainian", lv: "Latvian", en: "English" };
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{
              role: "user",
              content: `Write a warm, motivating weekly nutrition summary in ${langMap[language] || "English"} for ${name}.

Week data:
- Average daily calories: ${weekData.avgCalories} kcal (target: ${weekData.calorieTarget})
- Average protein: ${weekData.avgProtein}g
- Meals logged: ${weekData.mealsLogged}
- Streak: ${weekData.streak} days
- Money saved: €${weekData.moneySaved}
- Items used before expiry: ${weekData.itemsUsed}
- Recipes cooked: ${weekData.recipesCooked}
- Goal: ${weekData.goal || "eat healthy"}

Write 3-4 sentences. Be specific, warm, motivating. Mention actual numbers. End with encouragement for next week. No markdown, plain text only.`
            }],
            max_tokens: 200,
          }),
        });
        if (aiRes.ok) {
          const aiData = await aiRes.json();
          aiSummary = aiData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI summary failed:", e);
      }
    }

    const subjects: Record<string, string> = {
      ru: `📊 Итоги недели в TYANA — ${name}`,
      uk: `📊 Підсумки тижня в TYANA — ${name}`,
      lv: `📊 Nedēļas kopsavilkums TYANA — ${name}`,
      en: `📊 Your weekly TYANA report — ${name}`,
    };

    const d = weekData;
    const labels: Record<string, Record<string, string>> = {
      en: { ai: "Your week in review", cal: "kcal/day", meals: "meals logged", saved: "saved", recipes: "recipes cooked", items: "items used", protein: "protein/day", streak: "days in a row — keep going!", cta: "Open TYANA →", unsub: "To unsubscribe: Profile → Settings → Notifications" },
      ru: { ai: "Твоя неделя", cal: "ккал/день", meals: "приёмов пищи", saved: "сэкономлено", recipes: "рецептов приготовлено", items: "продуктов использовано", protein: "белка в день", streak: "дней подряд — не останавливайся!", cta: "Открыть TYANA →", unsub: "Чтобы отписаться: Профиль → Настройки → Уведомления" },
      uk: { ai: "Твій тиждень", cal: "ккал/день", meals: "прийомів їжі", saved: "зекономлено", recipes: "рецептів приготовано", items: "продуктів використано", protein: "білка на день", streak: "днів поспіль — не зупиняйся!", cta: "Відкрити TYANA →", unsub: "Щоб відписатися: Профіль → Налаштування → Сповіщення" },
      lv: { ai: "Tava nedēļa", cal: "kcal/dienā", meals: "ēdienreizes", saved: "ietaupīts", recipes: "receptes pagatavota", items: "produkti izmantoti", protein: "olbaltumvielu dienā", streak: "dienas pēc kārtas — turpini!", cta: "Atvērt TYANA →", unsub: "Lai atteiktos: Profils → Iestatījumi → Paziņojumi" },
    };
    const l = labels[language] || labels.en;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
  <div style="text-align:center;margin-bottom:24px">
    <h1 style="color:#7C3AED;font-size:28px;margin:0">TYANA</h1>
    <p style="color:#6B7280;font-size:14px;margin:8px 0 0">${subjects[language] || subjects.en}</p>
  </div>
  ${aiSummary ? `<div style="background:#F5F3FF;border-radius:12px;padding:16px;margin-bottom:24px">
    <p style="color:#7C3AED;font-weight:600;margin:0 0 8px">🧠 ${l.ai}</p>
    <p style="color:#374151;font-size:14px;line-height:1.6;margin:0">${aiSummary}</p>
  </div>` : ''}
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
    <div style="background:#F9FAFB;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:24px;font-weight:700;color:#1E1B4B;margin:0">${d.avgCalories}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0">${l.cal}</p>
    </div>
    <div style="background:#F9FAFB;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:24px;font-weight:700;color:#1E1B4B;margin:0">${d.mealsLogged}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0">${l.meals}</p>
    </div>
    <div style="background:#F9FAFB;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:24px;font-weight:700;color:#1E1B4B;margin:0">€${d.moneySaved}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0">${l.saved}</p>
    </div>
    <div style="background:#F9FAFB;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:24px;font-weight:700;color:#1E1B4B;margin:0">${d.recipesCooked}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0">${l.recipes}</p>
    </div>
    <div style="background:#F9FAFB;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:24px;font-weight:700;color:#1E1B4B;margin:0">${d.itemsUsed}</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0">${l.items}</p>
    </div>
    <div style="background:#F9FAFB;border-radius:12px;padding:16px;text-align:center">
      <p style="font-size:24px;font-weight:700;color:#1E1B4B;margin:0">${d.avgProtein}g</p>
      <p style="font-size:11px;color:#6B7280;margin:4px 0 0">${l.protein}</p>
    </div>
  </div>
  <div style="background:#F5F3FF;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px">
    <p style="font-size:32px;margin:0">${d.streak} 🔥</p>
    <p style="color:#7C3AED;font-size:13px;margin:4px 0 0">${l.streak}</p>
  </div>
  <div style="text-align:center;margin-bottom:32px">
    <a href="https://tyana.lovable.app" style="display:inline-block;background:#7C3AED;color:white;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:600;font-size:15px">${l.cta}</a>
  </div>
  <p style="text-align:center;color:#9CA3AF;font-size:11px">TYANA • tyana.lovable.app</p>
  <p style="text-align:center;color:#9CA3AF;font-size:10px">${l.unsub}</p>
</div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TYANA <hello@tyana.app>",
        to: email,
        subject: subjects[language] || subjects.en,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", res.status, err);
      return new Response(JSON.stringify({ error: "Email send failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-weekly-report error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
