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
    const { inventory, recentMeals, language } = await req.json();

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ tip: "Check your expiring items today!", emoji: "♻️", title: "Zero Waste Tip", category: "food", product: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };
    const lang = langMap[language] || 'English';

    const expiringItems = (inventory || []).filter((i: any) =>
      i.expires_at && new Date(i.expires_at) <= new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    );

    const recentlyUsedItems = (recentMeals || []).flatMap((m: any) => m.items || []);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: `YOU MUST respond ENTIRELY in ${lang}. This is critical.
You are a creative zero-waste lifestyle expert.
Give ONE specific, creative, actionable tip in ${lang}.
The tip must be based on the user's ACTUAL products.
Be creative and specific - not generic advice.
Think beyond cooking: cosmetics, cleaning, gardening, home fragrance.`
        }, {
          role: "user",
          content: `User's expiring products: ${expiringItems.map((i: any) => i.name).join(', ') || 'none'}
Recently used products: ${recentlyUsedItems.join(', ') || 'none'}
All inventory: ${(inventory || []).slice(0, 15).map((i: any) => i.name).join(', ') || 'none'}

Give ONE zero-waste tip. Examples of good tips:
- User has orange → "Высуши кожуру апельсина в духовке при 80°C 2 часа — получится натуральный ароматизатор для шкафа."
- User has wilting herbs → "Залей увядающую петрушку оливковым маслом в форме для льда — заморозь."
- User has old bread → "Нарежь старый хлеб кубиками, обжарь с чесноком и розмарином — домашние крутоны."
- User has coffee grounds → "Кофейная гуща — идеальный скраб для тела."

Return ONLY valid JSON, no markdown:
{"tip":"Full tip text with specific instructions","product":"Main product this tip is about","category":"food|beauty|cleaning|garden|home","emoji":"🍊","title":"Short catchy title max 5 words"}`
        }],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI error:", response.status);
      return new Response(JSON.stringify({ tip: "Check your expiring items today!", emoji: "♻️", title: "Zero Waste Tip", category: "food", product: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    let result: any = {};

    try {
      const text = data.choices?.[0]?.message?.content || "{}";
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      result = { tip: "Check your expiring items today!", emoji: "♻️", title: "Zero Waste Tip", category: "food", product: "" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("zero-waste-tip error:", e);
    return new Response(JSON.stringify({ tip: "Check your expiring items today!", emoji: "♻️", title: "Zero Waste Tip", category: "food", product: "" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
