import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getClaims(token);
    if (authError || !data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LUNARA_API_KEY = Deno.env.get("LUNARA_API_KEY");
    
    if (!LUNARA_API_KEY) {
      throw new Error("LUNARA_API_KEY is not configured");
    }

    const { action, audio, message, sessionId } = await req.json();

    // Pipecat Cloud API base URL
    const PIPECAT_API_BASE = "https://api.pipecat.daily.co";

    // Get session token for voice conversations
    if (action === "get-session") {
      // Start a new agent session with Pipecat Cloud
      const response = await fetch(`${PIPECAT_API_BASE}/v1/public/health-twin/start`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LUNARA_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            llm: {
              model: "gpt-4o-mini",
              messages: [{
                role: "system",
                content: `You are TYANA AI Health Twin - a personalized health assistant.

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

Keep responses concise (2-3 sentences) and actionable. Be empathetic and understanding.`
              }]
            },
            tts: {
              voice: "alloy"
            }
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Pipecat session error:", response.status, errorText);
        
        // If agent doesn't exist, return a simulated session for fallback
        if (response.status === 404) {
          // Return a local session ID for fallback mode
          return new Response(JSON.stringify({ 
            session_id: `local-${Date.now()}`,
            fallback_mode: true 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        throw new Error(`Failed to create Pipecat session: ${response.status} - ${errorText}`);
      }

      const sessionData = await response.json();
      return new Response(JSON.stringify(sessionData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For voice-chat and text-chat, use Lovable AI as fallback since Pipecat needs WebRTC
    if (action === "voice-chat" || action === "text-chat") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }

      const userMessage = action === "text-chat" ? message : "User sent voice message";

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are TYANA AI Health Twin - a personalized health assistant.

CRITICAL LANGUAGE RULE: 
- ALWAYS detect the language of the user's message and respond in the SAME language
- If user speaks in Ukrainian, respond in Ukrainian
- If user speaks in Russian, respond in Russian  
- If user speaks in English, respond in English

Your personality:
- Warm, supportive, and encouraging
- Evidence-based but accessible
- Proactive with health suggestions

Focus areas: Sleep, stress, energy, exercise, nutrition, mental wellness.
Keep responses concise (2-3 sentences) and actionable.`
            },
            { role: "user", content: userMessage }
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Lovable AI error:", response.status, errorText);
        throw new Error(`AI chat failed: ${response.status}`);
      }

      const aiResponse = await response.json();
      const responseText = aiResponse.choices?.[0]?.message?.content || "Извините, не могу ответить сейчас.";

      return new Response(JSON.stringify({
        transcript: userMessage,
        response: {
          text: responseText
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    console.error("Voice chat function error:", error);
    // Return generic error message to prevent information leakage
    return new Response(
      JSON.stringify({ error: "Voice service temporarily unavailable" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
