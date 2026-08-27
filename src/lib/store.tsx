"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { getProduct } from "@/lib/catalog";
import type { CurrencyCode } from "@/lib/format";
import type { ColorwayKey } from "@/lib/art";

/* ==================================================================
   TYPES
   ================================================================== */

export interface CartLine {
  /** product slug + colourway + size — the true identity of a line. */
  id: string;
  slug: string;
  colorway: ColorwayKey;
  size: string;
  qty: number;
  /** Bundles enter the cart as a single line with a fixed price. */
  bundleSlug?: string;
}

interface State {
  lines: CartLine[];
  wishlist: string[];
  recent: string[];
  currency: CurrencyCode;
  /** Hydrated from localStorage after mount — gates persistence writes. */
  ready: boolean;
}

type Action =
  | { type: "hydrate"; state: Partial<State> }
  | { type: "add"; line: Omit<CartLine, "id">; }
  | { type: "remove"; id: string }
  | { type: "qty"; id: string; qty: number }
  | { type: "clear" }
  | { type: "wishlist"; slug: string }
  | { type: "viewed"; slug: string }
  | { type: "currency"; currency: CurrencyCode };

const INITIAL: State = {
  lines: [],
  wishlist: [],
  recent: [],
  currency: "USD",
  ready: false,
};

const lineId = (l: Omit<CartLine, "id">) =>
  l.bundleSlug ? `bundle:${l.bundleSlug}` : `${l.slug}:${l.colorway}:${l.size}`;

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { ...state, ...action.state, ready: true };

    case "add": {
      const id = lineId(action.line);
      const existing = state.lines.find((l) => l.id === id);
      if (existing) {
        return {
          ...state,
          lines: state.lines.map((l) =>
            l.id === id ? { ...l, qty: Math.min(10, l.qty + action.line.qty) } : l,
          ),
        };
      }
      return { ...state, lines: [...state.lines, { ...action.line, id }] };
    }

    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };

    case "qty":
      return {
        ...state,
        lines:
          action.qty <= 0
            ? state.lines.filter((l) => l.id !== action.id)
            : state.lines.map((l) =>
                l.id === action.id ? { ...l, qty: Math.min(10, action.qty) } : l,
              ),
      };

    case "clear":
      return { ...state, lines: [] };

    case "wishlist":
      return {
        ...state,
        wishlist: state.wishlist.includes(action.slug)
          ? state.wishlist.filter((s) => s !== action.slug)
          : [action.slug, ...state.wishlist],
      };

    case "viewed":
      return {
        ...state,
        recent: [action.slug, ...state.recent.filter((s) => s !== action.slug)].slice(0, 8),
      };

    case "currency":
      return { ...state, currency: action.currency };

    default:
      return state;
  }
}

/* ==================================================================
   CONTEXT
   ================================================================== */

interface StoreValue extends State {
  add: (line: Omit<CartLine, "id">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  toggleWishlist: (slug: string) => void;
  markViewed: (slug: string) => void;
  setCurrency: (c: CurrencyCode) => void;

  count: number;
  subtotal: number;

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  /** Announced politely to screen readers when the cart changes. */
  announcement: string;
}

const StoreContext = createContext<StoreValue | null>(null);

const KEY = "chisseled.store.v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // Hydrate after mount so the server render and the first client render match.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      dispatch({ type: "hydrate", state: raw ? JSON.parse(raw) : {} });
    } catch {
      // Private mode, disabled storage, or corrupt JSON — start clean.
      dispatch({ type: "hydrate", state: {} });
    }
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    try {
      const { lines, wishlist, recent, currency } = state;
      window.localStorage.setItem(KEY, JSON.stringify({ lines, wishlist, recent, currency }));
    } catch {
      // Storage unavailable — the session still works, it just won't persist.
    }
  }, [state]);

  const add = useCallback((line: Omit<CartLine, "id">) => {
    dispatch({ type: "add", line });
    setCartOpen(true);
    const p = getProduct(line.slug);
    setAnnouncement(`${p?.name ?? "Item"} added to bag.`);
  }, []);

  const remove = useCallback((id: string) => {
    dispatch({ type: "remove", id });
    setAnnouncement("Item removed from bag.");
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    dispatch({ type: "qty", id, qty });
  }, []);

  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const toggleWishlist = useCallback((slug: string) => {
    dispatch({ type: "wishlist", slug });
  }, []);

  const markViewed = useCallback((slug: string) => {
    dispatch({ type: "viewed", slug });
  }, []);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    dispatch({ type: "currency", currency });
  }, []);

  const count = useMemo(
    () => state.lines.reduce((n, l) => n + l.qty, 0),
    [state.lines],
  );

  const subtotal = useMemo(
    () =>
      state.lines.reduce((sum, l) => {
        if (l.bundleSlug) return sum + (BUNDLE_PRICES[l.bundleSlug] ?? 0) * l.qty;
        return sum + (getProduct(l.slug)?.price ?? 0) * l.qty;
      }, 0),
    [state.lines],
  );

  const value: StoreValue = {
    ...state,
    add,
    remove,
    setQty,
    clear,
    toggleWishlist,
    markViewed,
    setCurrency,
    count,
    subtotal,
    cartOpen,
    setCartOpen,
    searchOpen,
    setSearchOpen,
    announcement,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/** Bundle prices are duplicated here to keep the reducer synchronous. */
const BUNDLE_PRICES: Record<string, number> = {
  "the-starter": 74000,
  "the-performance": 138000,
  "the-complete-chisseled": 298000,
  "the-womens-performance": 168000,
};
