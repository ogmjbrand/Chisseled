import { NextResponse } from "next/server";
import { runAssistantTurn } from "@/lib/assistant/anthropic";
import { getAssistantProductBySlug } from "@/lib/assistant/catalog";
import type { ChatRequestBody, ChatResponseBody } from "@/lib/assistant/types";

export const runtime = "nodejs";

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

function productSlugFromPathname(pathname: string | undefined): string | null {
  const match = pathname?.match(/^\/product\/([a-z0-9-]+)/);
  return match ? match[1] : null;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (messages.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  // A bounded, validated slice — this is a public endpoint, so the shape and
  // size of what it forwards to the model has to be trusted, not assumed.
  const history = messages
    .slice(-MAX_MESSAGES)
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));

  if (history.length === 0) {
    return NextResponse.json({ error: "No valid message provided." }, { status: 400 });
  }

  const slug = productSlugFromPathname(body.pathname);
  const pageContext = slug ? await getAssistantProductBySlug(slug) : null;

  try {
    const { reply, products } = await runAssistantTurn(history, pageContext);
    const payload: ChatResponseBody = { reply, products };
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof Error && error.message === "ANTHROPIC_API_KEY is not set") {
      return NextResponse.json(
        { error: "The CHISSELED AI assistant isn't configured yet. Set ANTHROPIC_API_KEY to enable it." },
        { status: 503 },
      );
    }

    // Upstream/network failure — logged for diagnosis, never surfaced verbatim to the client.
    console.error("[assistant] chat turn failed:", error);
    return NextResponse.json(
      { error: "The assistant is unavailable right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
