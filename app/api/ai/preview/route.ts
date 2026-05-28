import { NextResponse } from "next/server";

// ── Rate limiter ──────────────────────────────────────────────────────────────
// In-memory Map with TTL: 3 generations per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  return "127.0.0.1";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // Fresh window
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: 2, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

// ── POST handler ──────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { rawIdea, postType, platforms } = await req.json();

    if (!rawIdea || typeof rawIdea !== "string" || !rawIdea.trim()) {
      return NextResponse.json({ error: "rawIdea is required" }, { status: 400 });
    }

    const validTypes = ["Tip", "Thread", "Story", "Opinion", "Question"];
    const type = validTypes.includes(postType) ? postType : "Tip";

    const validPlatforms = ["twitter", "linkedin"];
    const selectedPlatforms = Array.isArray(platforms)
      ? platforms.filter((p: string) => validPlatforms.includes(p))
      : ["twitter", "linkedin"];

    if (selectedPlatforms.length === 0) {
      return NextResponse.json({ error: "At least one platform is required" }, { status: 400 });
    }

    // Rate limit
    const ip = getClientIp(req);
    const { allowed, remaining, resetAt } = checkRateLimit(ip);

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "You've tried 3 posts — sign up free to generate more.",
          retryAfter,
        },
        { status: 429 }
      );
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Build prompt
    const platformInstructions = selectedPlatforms.map((p: string) => {
      if (p === "twitter") {
        return type === "Thread"
          ? "- Twitter: Write a multi-tweet thread (3-6 tweets). Each tweet should be under 280 characters."
          : "- Twitter: Write a single post under 280 characters.";
      }
      if (p === "linkedin") {
        return "- LinkedIn: Write a conversational post, 100-250 words. No bullet-point lists unless type is Tip.";
      }
      return "";
    }).filter(Boolean).join("\n");

    const systemPrompt = `You are a sharp social media ghostwriter. Write content that is direct, human, and sounds like a real person — not AI-generated. Rules: never start with 'I', never use 'game-changer', 'In today's world', 'I'm excited to share', 'Let's dive in', or any filler opener. Get to the point in the first line.

Write a ${type.toLowerCase()} post about: ${rawIdea.trim()}

${platformInstructions}

Return only valid JSON, no markdown fences, no explanation:
${selectedPlatforms.includes("twitter") ? `{ "twitter": "...", "linkedin": ${selectedPlatforms.includes("linkedin") ? '"..."' : '""'}, "twitterCharCount": number }` : `{ "linkedin": "...", "twitter": "", "twitterCharCount": 0 }`}`;

    // Call OpenRouter with streaming
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "ThreadBase",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: rawIdea.trim() },
        ],
        max_tokens: 600,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      if (response.status === 502) {
        // Likely quota exhausted or server error – inform client
        console.error("[PREVIEW] OpenRouter 502 error (quota or server):", errText);
        return NextResponse.json({ error: "AI service unavailable (quota exhausted or server error). Please try again later." }, { status: 502 });
      }
      if (response.status === 429) {
        // Forward rate limit info
        return NextResponse.json({ error: "Rate limit exceeded", details: errText }, { status: 429 });
      }
      console.error("[PREVIEW] OpenRouter error:", errText);
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }


    // Stream the OpenRouter response to the client as NDJSON
    const encoder = new TextEncoder();
    // Ensure we have a readable stream from OpenRouter
    if (!response.body) {
      console.error("[PREVIEW] OpenRouter returned no body stream");
      return NextResponse.json({ error: "AI generation failed (no stream)" }, { status: 502 });
    }
    const openRouterStream = response.body!; // now safe

    const reader = openRouterStream.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Parse SSE events from OpenRouter
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(data);
                  const delta =
                    parsed.choices?.[0]?.delta?.content ||
                    parsed.choices?.[0]?.delta?.text ||
                    "";
                  if (delta) {
                    fullContent += delta;
                    const event = JSON.stringify({ type: "delta", content: delta });
                    controller.enqueue(encoder.encode(event + "\n"));
                  }
                } catch {
                  // Skip non-JSON SSE data
                }
              }
            }
          }

          // Send completion event
          controller.enqueue(encoder.encode(JSON.stringify({ type: "done", content: fullContent }) + "\n"));
        } catch (err) {
          controller.enqueue(encoder.encode(JSON.stringify({ type: "error", message: "Stream interrupted" }) + "\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (err) {
    console.error('[PREVIEW] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
