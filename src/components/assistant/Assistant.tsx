"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useEscape, useFocusTrap, useScrollLock } from "@/lib/motion";
import { AssistantProductCard } from "@/components/assistant/AssistantProductCard";
import { CloseMark, SendMark, SparkMark } from "@/components/primitives/Marks";
import type { AssistantChatMessage } from "@/lib/assistant/types";

const QUICK_ACTIONS = [
  "Find the right product",
  "Product recommendations",
  "Ingredients & benefits",
  "How to use",
  "Compare products",
  "Shipping & orders",
];

const OPENING_LINE =
  "Hi, I'm CHISSELED AI. I can help you find the right product, understand ingredients, compare options, and answer questions before you buy.";

export function Assistant() {
  const pathname = usePathname();
  const { cartOpen, searchOpen } = useStore();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  useEscape(open, () => setOpen(false));
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 300);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || loading) return;

      const next = [...messages, { role: "user" as const, content }];
      setMessages(next);
      setInput("");
      setError(null);
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: next, pathname }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Something went wrong. Please try again.");
          return;
        }

        setMessages((prev) => [...prev, { role: "assistant", content: data.reply, products: data.products }]);
      } catch {
        setError("Couldn't reach the assistant. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, pathname],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const isPDP = pathname?.startsWith("/product/") ?? false;
  const hidden = cartOpen || searchOpen;

  return (
    <>
      {/* --- Launcher --- */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close CHISSELED AI assistant" : "Open CHISSELED AI assistant"}
        aria-expanded={open}
        className={[
          "group fixed right-4 z-[90] flex h-[3.25rem] items-center gap-2.5 border border-bone/15 bg-ink px-5 shadow-[var(--shadow-lift)] transition-all duration-500 ease-[var(--ease-out-expo)] hover:border-bone/35 sm:right-6",
          isPDP ? "bottom-24" : "bottom-6",
          hidden || open ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100",
        ].join(" ")}
      >
        <SparkMark className="size-4 text-purple-bright transition-transform duration-500 group-hover:rotate-[24deg]" />
        <span className="font-mono text-micro font-medium uppercase tracking-[0.16em] text-bone">Ask CHISSELED</span>
      </button>

      {/* --- Panel --- */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-label="CHISSELED AI assistant"
        inert={!open}
        className={[
          "fixed z-[91] flex flex-col overflow-hidden border border-bone/10 bg-ink shadow-[var(--shadow-panel)] transition-all duration-500 ease-[var(--ease-out-expo)]",
          "inset-x-0 bottom-0 h-[min(32rem,85svh)] rounded-t-2xl",
          "sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[34rem] sm:w-[24rem] sm:rounded-none",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
        ].join(" ")}
      >
        {/* Header */}
        <div className="glass-black flex shrink-0 items-center justify-between gap-3 border-b border-bone/10 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center border border-purple/30 bg-purple/10">
              <SparkMark className="size-4 text-purple-bright" />
            </span>
            <div>
              <p className="text-caption font-medium text-bone">CHISSELED AI</p>
              <p className="font-mono text-micro uppercase tracking-[0.1em] text-smoke">Shopping assistant</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="p-2 text-fog transition-colors hover:text-bone"
          >
            <CloseMark className="size-5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4">
          {messages.length === 0 ? (
            <div>
              <p className="text-body-sm leading-relaxed text-fog">{OPENING_LINE}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => send(action)}
                    className="border border-bone/15 px-3 py-2 text-left font-mono text-micro uppercase tracking-[0.1em] text-fog transition-colors hover:border-bone/40 hover:text-bone"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={m.role === "user" ? "max-w-[85%]" : "max-w-full"}>
                  <div
                    className={[
                      "px-3.5 py-2.5 text-body-sm leading-relaxed",
                      m.role === "user" ? "bg-bone text-ink" : "border border-bone/10 bg-carbon text-fog",
                    ].join(" ")}
                  >
                    {m.content}
                  </div>
                  {m.products && m.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.map((p) => (
                        <AssistantProductCard key={p.slug} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center gap-1.5 border border-bone/10 bg-carbon px-3.5 py-3 w-fit" aria-label="CHISSELED AI is typing">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-smoke"
                  style={{ animation: `chisseled-typing 1.2s ease-in-out ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="border border-signal-low/30 bg-signal-low/10 px-3.5 py-2.5 text-body-sm text-signal-low">
              {error}
            </p>
          )}
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-t border-bone/10 p-3">
          <label htmlFor="assistant-input" className="sr-only">
            Ask CHISSELED AI
          </label>
          <input
            ref={inputRef}
            id="assistant-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a product…"
            autoComplete="off"
            className="field flex-1"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="btn btn-primary !p-3 disabled:opacity-40"
          >
            <SendMark className="size-4" />
          </button>
        </form>
      </div>
    </>
  );
}
