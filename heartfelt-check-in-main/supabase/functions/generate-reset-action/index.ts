import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are a mental reset engine.

Your job is NOT to explain emotions.
Your job is to create short, practical actions that help someone feel noticeably better within 30–120 seconds.

Rules:
- No therapy language
- No long explanations
- No questions unless absolutely necessary
- No affirmations
- No "how does this make you feel"

Each action must:
1. Take under 2 minutes
2. Be clear and specific
3. Work without typing or deep thinking
4. Interrupt mental loops or emotional inertia
5. End with a clear stopping point

Tone:
- Calm
- Direct
- Human
- Not motivational

Output format (JSON only, no markdown):
{
  "title": "max 5 words",
  "duration": 60,
  "steps": ["step 1", "step 2", "step 3"]
}

Maximum 4 steps. Duration in seconds.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mood, intensity, triggers, actionType } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let userPrompt = '';
    
    if (actionType === 'break-loop') {
      userPrompt = `Create a 30–60 second action designed to interrupt repetitive thinking.

Constraints:
- No breathing counts
- No affirmations
- No explanations
- No emotional labels

The action must force attention outward or into movement.`;
    } else if (actionType === 'shift-focus') {
      userPrompt = `Create a short action that redirects attention without requiring effort.

User state:
- Mild emotional discomfort
- Wants quick relief
- Has low motivation

Avoid:
- Self-reflection
- Positivity framing`;
    } else if (mood && triggers) {
      // Post check-in action
      userPrompt = `Create a short action based on this mood data:

Mood: ${mood}
Intensity: ${intensity || 'Medium'}
Triggers: ${triggers.join(', ')}
Time available: 1 minute

The action should:
- Not involve thinking about ${triggers[0] || 'the trigger'}
- Create a clean mental reset
- Be neutral, not motivational`;
    } else {
      // Default reset action
      userPrompt = `Create a 60–90 second action for someone who feels ${mood || 'uninspired'} and mentally flat.

Context:
- They are not anxious or distressed
- They feel stuck, bored, or low-energy
- They want relief, not insight

Constraints:
- No breathing exercises
- No journaling
- No mindfulness language
- No visualization

The action should:
- Change physical state or attention
- Require minimal effort
- Feel slightly surprising or novel
- Be doable anywhere`;
    }

    console.log('Generating reset action for:', { mood, intensity, triggers, actionType });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Service temporarily unavailable.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Parse the JSON response
    let action;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        action = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback action
      action = {
        title: "Pattern Break",
        duration: 60,
        steps: [
          "Stand up and look for 5 blue objects around you.",
          "Touch 3 different textures near you.",
          "Take one slow breath in through the nose, out through the mouth.",
          "Sit back down when done."
        ]
      };
    }

    return new Response(JSON.stringify(action), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-reset-action:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
