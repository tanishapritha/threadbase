import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { rawIdea, tone } = await req.json();

    if (!rawIdea) {
      return NextResponse.json({ error: "rawIdea is required" }, { status: 400 });
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // Call OpenRouter (Claude 3.5 Sonnet is a good default for high quality formatting)
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ThreadBase",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "system",
            content: `You are an expert social media manager. Your task is to take a raw idea and format it perfectly for Twitter/X and LinkedIn.
The user wants the tone to be: ${tone || "Professional"}.

Respond ONLY with a valid JSON object in the exact following format:
{
  "twitter": "The formatted tweet or thread here. Keep it engaging and concise.",
  "linkedin": "The formatted LinkedIn post here. Use appropriate spacing, professional formatting, and relevant hashtags."
}`
          },
          {
            role: "user",
            content: rawIdea
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", errText);
      return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error("Failed to parse JSON:", content);
      return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
