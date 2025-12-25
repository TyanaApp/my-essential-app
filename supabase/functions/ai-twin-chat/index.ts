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
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompts: Record<string, string> = {
      en: `You are an AI Health Twin - a personalized health assistant. You analyze user's health patterns, sleep, stress levels, and provide actionable recommendations.

Your personality:
- Warm, supportive, and encouraging
- Evidence-based but accessible
- Proactive with health suggestions
- Remember context from the conversation

Focus areas:
- Sleep optimization
- Stress management
- Energy levels
- Exercise recommendations
- Nutrition tips
- Mental wellness

Keep responses concise (2-3 sentences) and actionable. Use emojis sparingly for warmth.`,
      
      ru: `Ты ИИ-близнец здоровья - персонализированный помощник по здоровью. Ты анализируешь паттерны здоровья пользователя, сон, уровень стресса и даёшь практические рекомендации.

Твоя личность:
- Тёплый, поддерживающий и вдохновляющий
- Научно обоснованный, но доступный
- Проактивный с советами по здоровью
- Помнишь контекст разговора

Фокус:
- Оптимизация сна
- Управление стрессом
- Уровни энергии
- Рекомендации по упражнениям
- Советы по питанию
- Ментальное здоровье

Отвечай кратко (2-3 предложения) и практично. Используй эмодзи умеренно для теплоты.`,
      
      lv: `Tu esi AI Veselības Dvīnis - personalizēts veselības asistents. Tu analizē lietotāja veselības modeļus, miegu, stresa līmeni un sniedz praktiski pielietojamas rekomendācijas.

Tava personība:
- Silts, atbalstošs un iedrošinošs
- Uz pierādījumiem balstīts, bet pieejams
- Proaktīvs ar veselības ieteikumiem
- Atceries sarunas kontekstu

Fokusa jomas:
- Miega optimizācija
- Stresa pārvaldība
- Enerģijas līmeņi
- Vingrinājumu ieteikumi
- Uztura padomi
- Mentālā labklājība

Atbildi īsi (2-3 teikumi) un praktiski. Izmanto emocijzīmes mēreni siltumam.`
    };

    const systemPrompt = systemPrompts[language] || systemPrompts.en;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
