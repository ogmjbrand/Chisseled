/**
 * A trimmed, chat-safe product shape — never the full `Product` type. The
 * assistant tool returns exactly these fields (all sourced from live
 * Shopify data), so a card the client renders can never carry more than
 * the model was actually given, and the model can never be handed fields
 * (reviews, fabricated benefits copy, etc.) it has no business repeating.
 */
export interface AssistantProduct {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  priceCents: number;
  compareAtCents?: number;
  imageUrl: string | null;
  colorway: string;
  sizes: string[];
  inStockSizes: string[];
}

export interface AssistantChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Only ever set on an assistant message, and only from a real tool call. */
  products?: AssistantProduct[];
}

export interface ChatRequestBody {
  messages: AssistantChatMessage[];
  /** Current storefront path, e.g. "/product/creatine-monohydrate" — used for page context only. */
  pathname?: string;
}

export interface ChatResponseBody {
  reply: string;
  products: AssistantProduct[];
}
