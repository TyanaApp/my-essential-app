import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, language, fileType, currency: userCurrency } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const langMap: Record<string, string> = { ru: 'Russian', uk: 'Ukrainian', lv: 'Latvian', en: 'English' };

    const isPdf = fileType === 'pdf';

    const contentParts: any[] = [];

    if (isPdf) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${imageBase64}` }
      });
    } else {
      contentParts.push({
        type: "image_url",
        image_url: { 
          url: `data:image/jpeg;base64,${imageBase64}`,
          detail: "high"
        }
      });
    }

    const currencyHint = userCurrency ? `The user expects currency "${userCurrency}". Use this unless the receipt clearly shows a different currency.` : '';

    contentParts.push({
      type: "text",
      text: `YOU MUST respond in ${langMap[language] || 'English'}.

You are an expert OCR system for shopping receipts.
Read this receipt image carefully, line by line.

Your job: extract ALL purchased items with prices.

IMPORTANT OCR RULES:
- Read every line carefully, even if blurry
- Product names may be abbreviated — expand when possible
- Prices may use , or . as decimal separator
- Currency may be shown as €/$£/₽/₴/zł/Eur/EUR/USD/RUB/UAH/PLN/GBP/Ls/LVL
- Detect currency from receipt automatically
${currencyHint}
- If image is blurry, still try to extract what you can

CLASSIFY each item:
FOOD (isFood: true): All food products, ingredients, drinks, spices, sauces, condiments, baby food, pet food, alcohol
NOT FOOD (isFood: false): Household cleaning, personal care, cosmetics, medicine, vitamins, clothing, electronics, bags, packaging, cigarettes, tobacco

For the totals:
- foodTotal = sum of ONLY food items prices
- nonFoodTotal = sum of everything else
- receiptTotal = full receipt total

Return ONLY valid JSON (no markdown, no backticks):
{
  "store": "Store name if visible",
  "date": "YYYY-MM-DD",
  "receiptTotal": 45.20,
  "foodTotal": 32.50,
  "nonFoodTotal": 12.70,
  "currency": "EUR",
  "items": [
    {
      "name": "Item name in ${langMap[language] || 'English'}",
      "quantity": 1,
      "unit": "pcs",
      "price": 1.29,
      "isFood": true,
      "suggestedStorage": "fridge"
    }
  ]
}

Rules:
- unit: "g", "kg", "ml", "L", "pcs", "pack"
- suggestedStorage: "fridge" / "pantry" / "freezer" for food items, null for non-food
- Be smart: milk→fridge, pasta→pantry, meat→fridge, ice cream→freezer
- If currency not visible, default to "EUR"
- Translate item names to ${langMap[language] || 'English'}`
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: contentParts
        }],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content || "{}";

    let result: any = {};
    try {
      result = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      console.error("Failed to parse AI response:", text);
      result = { error: true, raw: text };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-receipt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
