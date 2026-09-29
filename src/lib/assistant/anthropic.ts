import "server-only";
import { searchAssistantProducts } from "@/lib/assistant/catalog";
import type { AssistantChatMessage, AssistantProduct } from "@/lib/assistant/types";

/**
 * No @anthropic-ai/sdk here — this project deliberately carries zero runtime
 * dependencies beyond next/react/react-dom, and the Messages API is a single
 * JSON POST, so a raw fetch keeps that true rather than pulling in a client
 * library for one endpoint.
 */
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-5";
const MAX_TOKENS = 700;
/** One tool round-trip is what a product lookup needs; a second call is the hard stop against a runaway loop. */
const MAX_TOOL_ROUNDS = 2;

const SEARCH_PRODUCTS_TOOL = {
  name: "search_products",
  description:
    "Search the real, live CHISSELED product catalogue on Shopify. Always call this before naming, describing, recommending, or pricing any specific product — never answer from memory. Returns only products that actually exist and are actually listed; an empty result means nothing matched, not that you should suggest something else.",
  input_schema: {
    type: "object" as const,
    properties: {
      query: {
        type: "string",
        description:
          "Free-text search terms — what the customer is looking for (e.g. \"weight loss tea\", \"compression leggings\", \"creatine\").",
      },
      category: {
        type: "string",
        description: "Optional product category or type filter (e.g. \"Leggings\", \"Hoodies\", \"Tops\").",
      },
    },
  },
};

/**
 * Verified, static site copy — the same shipping/returns/sizing terms
 * published on /about#legal — given to the model as reference so a
 * "Shipping & orders" question gets the real policy instead of a plausible
 * guess. Keep this in sync with FAQ_SECTIONS in src/app/about/page.tsx if
 * those terms ever change.
 */
const VERIFIED_POLICIES = [
  "Shipping — United States: 3–5 business days, free on orders over $100, otherwise $7; express is 1–2 business days at $18. International: 6–12 business days to 38 countries at $35, duties/import taxes calculated at checkout. Every order ships with tracking.",
  "Returns — 30 days from delivery, unworn/unwashed with tags attached. Free within the US; international returns are at the customer's cost unless the item is faulty. Nutrition items must be unopened. Refunds process within 3 working days of the return arriving.",
  "Sizing — every product page carries a full measurement table in centimetres plus the height/size of the model shown. Between sizes: compression/sculpt fits run close — size up for comfort, down for hold. Wrong-size exchanges within the US ship the replacement before the original arrives back.",
].join("\n");

function systemPrompt(pageContext: AssistantProduct | null): string {
  const lines = [
    "You are CHISSELED AI, the official shopping assistant for CHISSELED — a premium performance apparel, training and nutrition brand.",
    "",
    "Voice: confident, premium, minimal, human. Short, direct sentences. No corporate filler, no exclamation points, no generic chatbot phrasing like \"How can I help you today?\".",
    "",
    "HARD RULES — never break these:",
    "1. Only discuss specific products returned by the search_products tool in this conversation. Never invent a product name, price, ingredient, colourway, size, stock status, or URL. If you have not called the tool for a claim, do not make the claim.",
    "2. If search_products returns no matches, say so plainly and suggest the customer browse /shop or describe what they need differently. Never substitute an invented product to fill the gap.",
    "3. Never make medical claims. Do not say a product cures, treats, or guarantees a result for any medical condition, disease, or weight-loss outcome, and never say a product replaces medication. Keep any health-adjacent answer informational and measured, and suggest speaking with a healthcare professional for medical questions.",
    "4. Never fabricate ingredients, dosages, clinical evidence, certifications, or reviews. If you don't have verified information about something — including order status, account details, or anything not covered below or by search_products — say exactly: \"I don't have verified information about that.\"",
    "5. Keep replies concise — a few sentences at most. You are a shopping assistant, not a long-form chat. Let product cards (rendered separately by the app from your tool results) do the visual work; you do not need to restate every field.",
    "",
    "VERIFIED STORE POLICIES (safe to state as fact — this is the real, published policy, not a tool result):",
    VERIFIED_POLICIES,
  ];

  if (pageContext) {
    lines.push(
      "",
      `The customer is currently viewing this product page: "${pageContext.name}" (${pageContext.category}) — ${pageContext.tagline}. You may mention this naturally once near the start of the conversation if it's relevant; do not repeat it on every turn.`,
    );
  }

  return lines.join("\n");
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}
interface AnthropicToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}
type AnthropicContentBlock = AnthropicTextBlock | AnthropicToolUseBlock;

interface AnthropicResponse {
  content: AnthropicContentBlock[];
  stop_reason: string;
  error?: { message: string };
}

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[] | { type: "tool_result"; tool_use_id: string; content: string }[];
};

async function callAnthropic(apiKey: string, messages: AnthropicMessage[], system: string): Promise<AnthropicResponse> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
      tools: [SEARCH_PRODUCTS_TOOL],
    }),
  });

  const data = (await res.json()) as AnthropicResponse;

  if (!res.ok) {
    throw new Error(data.error?.message ?? `Anthropic API error (${res.status})`);
  }

  return data;
}

function textFrom(content: AnthropicContentBlock[]): string {
  return content
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export interface AssistantTurnResult {
  reply: string;
  products: AssistantProduct[];
}

/**
 * Runs one assistant turn against the Messages API, executing search_products
 * locally whenever the model calls it and feeding the result back — the
 * standard Anthropic tool-use loop, capped at MAX_TOOL_ROUNDS so a stuck
 * model can't turn one chat message into an unbounded chain of API calls.
 */
export async function runAssistantTurn(
  history: AssistantChatMessage[],
  pageContext: AssistantProduct | null,
): Promise<AssistantTurnResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const system = systemPrompt(pageContext);
  const messages: AnthropicMessage[] = history.map((m) => ({ role: m.role, content: m.content }));
  const foundProducts: AssistantProduct[] = [];
  const seenSlugs = new Set<string>();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    // eslint-disable-next-line no-await-in-loop
    const response = await callAnthropic(apiKey, messages, system);

    const toolUses = response.content.filter((b): b is AnthropicToolUseBlock => b.type === "tool_use");

    if (toolUses.length === 0 || round === MAX_TOOL_ROUNDS) {
      const reply = textFrom(response.content) || "I don't have a response for that right now — could you rephrase?";
      return { reply, products: foundProducts };
    }

    messages.push({ role: "assistant", content: response.content });

    // eslint-disable-next-line no-await-in-loop
    const toolResults = await Promise.all(
      toolUses.map(async (call) => {
        const input = call.input as { query?: string; category?: string };
        const results =
          call.name === "search_products" ? await searchAssistantProducts(input) : [];

        for (const product of results) {
          if (!seenSlugs.has(product.slug)) {
            seenSlugs.add(product.slug);
            foundProducts.push(product);
          }
        }

        return {
          type: "tool_result" as const,
          tool_use_id: call.id,
          content: JSON.stringify(
            results.length > 0
              ? results
              : { message: "No matching products found in the live catalogue." },
          ),
        };
      }),
    );

    messages.push({ role: "user", content: toolResults });
  }

  return { reply: "I don't have a response for that right now — could you rephrase?", products: foundProducts };
}
