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
    const { content, source } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing sentiment for content:", content.substring(0, 100));

    // Analyze sentiment using Gemini
    const sentimentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis expert. Analyze the sentiment of the given text and return ONLY a JSON object with these fields: sentiment (must be exactly 'positive', 'neutral', or 'negative'), score (0-1, where 0 is most negative and 1 is most positive), and a brief explanation."
          },
          {
            role: "user",
            content: `Analyze the sentiment of this ${source} post: "${content}"`
          }
        ],
      }),
    });

    if (!sentimentResponse.ok) {
      const errorText = await sentimentResponse.text();
      console.error("Sentiment analysis error:", sentimentResponse.status, errorText);
      throw new Error("Failed to analyze sentiment");
    }

    const sentimentData = await sentimentResponse.json();
    const sentimentText = sentimentData.choices[0].message.content;
    
    console.log("Raw sentiment response:", sentimentText);
    
    // Parse the JSON response
    const sentimentJson = JSON.parse(sentimentText.replace(/```json\n?|\n?```/g, '').trim());

    // Generate suggested response if sentiment is negative
    let suggestedResponse = null;
    if (sentimentJson.sentiment === "negative") {
      console.log("Generating suggested response for negative mention");
      
      const responseGeneration = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a customer service expert. Generate a professional, empathetic, and helpful response to address negative customer feedback. Keep it concise (2-3 sentences), acknowledge the concern, and offer to help."
            },
            {
              role: "user",
              content: `Generate a professional response to this ${source} post: "${content}"`
            }
          ],
        }),
      });

      if (responseGeneration.ok) {
        const responseData = await responseGeneration.json();
        suggestedResponse = responseData.choices[0].message.content.trim();
        console.log("Generated suggested response:", suggestedResponse);
      }
    }

    const result = {
      sentiment: sentimentJson.sentiment,
      sentimentScore: parseFloat(sentimentJson.score),
      explanation: sentimentJson.explanation || "",
      suggestedResponse,
    };

    console.log("Analysis complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-sentiment function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});