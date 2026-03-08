import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, language } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subjects: Record<string, string> = {
      ru: "Добро пожаловать в TYANA! 🎉",
      uk: "Ласкаво просимо до TYANA! 🎉",
      lv: "Laipni lūdzam TYANA! 🎉",
      en: "Welcome to TYANA! 🎉",
    };

    const bodies: Record<string, string> = {
      ru: `Привет, ${name}! 👋

Добро пожаловать в TYANA — твой персональный ИИ-нутрициолог.

Твой 7-дневный Pro trial уже активирован! 🚀

Вот с чего начать:
📸 Сфотографируй холодильник → получи список продуктов за 10 секунд
🍽 Сгенерируй рецепты из того что есть дома
📊 Запиши первый приём пищи и отследи калории
🛒 Добавь список покупок голосом

Открыть TYANA: https://tyana.lovable.app

С любовью,
Команда TYANA 💜

P.S. Есть вопросы? Пиши нам в приложении!`,

      uk: `Привіт, ${name}! 👋

Ласкаво просимо до TYANA — твій персональний ШІ-нутріціолог.

Твій 7-денний Pro trial вже активовано! 🚀

З чого почати:
📸 Сфотографуй холодильник → отримай список продуктів за 10 секунд
🍽 Згенеруй рецепти з того що є вдома
📊 Запиши перший прийом їжі та відстеж калорії
🛒 Додай список покупок голосом

Відкрити TYANA: https://tyana.lovable.app

З любов'ю,
Команда TYANA 💜

P.S. Є питання? Пиши нам у додатку!`,

      lv: `Sveiki, ${name}! 👋

Laipni lūdzam TYANA — tavs personīgais AI uztura asistents.

Tavs 7 dienu Pro izmēģinājums ir aktivizēts! 🚀

Kā sākt:
📸 Nofotografē ledusskapi → saņem produktu sarakstu 10 sekundēs
🍽 Ģenerē receptes no tā kas ir mājās
📊 Ieraksti pirmo ēdienreizi
🛒 Pievieno iepirkumu sarakstu ar balsi

Atvērt TYANA: https://tyana.lovable.app

Ar mīlestību,
TYANA komanda 💜

P.S. Jautājumi? Rakstiet mums lietotnē!`,

      en: `Hi ${name}! 👋

Welcome to TYANA — your personal AI nutrition assistant.

Your 7-day Pro trial is now active! 🚀

Here's how to start:
📸 Photo your fridge → get product list in 10 seconds
🍽 Generate recipes from what you have at home
📊 Log your first meal and track calories
🛒 Add shopping list by voice

Open TYANA: https://tyana.lovable.app

With love,
TYANA Team 💜

Questions? Reach us in the app!`,
    };

    const subject = subjects[language] || subjects.en;
    const body = bodies[language] || bodies.en;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TYANA <hello@tyana.app>",
        to: email,
        subject,
        text: body,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend error:", res.status, errorText);
      return new Response(JSON.stringify({ error: "Email send failed" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-welcome-email error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
