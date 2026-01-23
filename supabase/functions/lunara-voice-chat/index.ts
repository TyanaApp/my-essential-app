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
    const LUNARA_API_KEY = Deno.env.get("LUNARA_API_KEY");
    
    if (!LUNARA_API_KEY) {
      throw new Error("LUNARA_API_KEY is not configured");
    }

    const { action, audio, message, sessionId } = await req.json();

    // Get session token for voice conversations
    if (action === "get-session") {
      const response = await fetch("https://api.lunara.ai/v1/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LUNARA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_config: {
            name: "TYANA Health Twin",
            language: "auto",
            voice: {
              provider: "elevenlabs",
              voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
            },
            system_prompt: `You are TYANA AI Health Twin - a personalized health assistant.

CRITICAL LANGUAGE RULE: 
- ALWAYS detect the language of the user's message and respond in the SAME language
- If user speaks in Ukrainian, respond in Ukrainian
- If user speaks in Russian, respond in Russian  
- If user speaks in English, respond in English
- And so on for ANY language

Your personality:
- Warm, supportive, and encouraging
- Evidence-based but accessible
- Proactive with health suggestions

Focus areas:
- Sleep optimization and quality
- Stress management techniques
- Energy levels throughout the day
- Exercise recommendations
- Nutrition tips
- Mental wellness and mindfulness

Keep responses concise (2-3 sentences) and actionable. Be empathetic and understanding.`,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lunara session error:", response.status, errorText);
        throw new Error(`Failed to create Lunara session: ${response.status}`);
      }

      const sessionData = await response.json();
      return new Response(JSON.stringify(sessionData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process voice input
    if (action === "voice-chat") {
      const response = await fetch("https://api.lunara.ai/v1/chat/voice", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LUNARA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          audio_data: audio,
          audio_format: "webm",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lunara voice chat error:", response.status, errorText);
        throw new Error(`Voice chat failed: ${response.status}`);
      }

      const chatResponse = await response.json();
      return new Response(JSON.stringify(chatResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Text chat fallback
    if (action === "text-chat") {
      const response = await fetch("https://api.lunara.ai/v1/chat/text", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LUNARA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: message,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lunara text chat error:", response.status, errorText);
        throw new Error(`Text chat failed: ${response.status}`);
      }

      const chatResponse = await response.json();
      return new Response(JSON.stringify(chatResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Lunara function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
