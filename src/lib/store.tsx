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
import {
  addLineToCartAction,
  getCartSummaryAction,
  removeLineAction,
  updateLineQtyAction,
  type CartSummary,
} from "@/lib/shopify/actions";

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
  /** Live unit-inclusive line total in cents, as priced by Shopify. */
  priceCents: number;
}

interface State {
  lines: CartLine[];
  wishlist: string[];
  recent: string[];
  currency: CurrencyCode;
  /** Hydrated from Shopify (cart) / localStorage (wishlist, recent, currency) after mount. */
  ready: boolean;
  checkoutUrl: string | null;
  subtotalCents: number;
  cartLoading: boolean;
  cartError: string | null;
}

type Action =
  | { type: "hydratePreferences"; state: Partial<Pick<State, "wishlist" | "recent" | "currency">> }
  | { type: "cart"; summary: CartSummary }
  | { type: "cartLoading" }
  | { type: "wishlist"; slug: string }
  | { type: "viewed"; slug: string }
  | { type: "currency"; currency: CurrencyCode };

const INITIAL: State = {
  lines: [],
  wishlist: [],
  recent: [],
  currency: "USD",
  ready: false,
  checkoutUrl: null,
  subtotalCents: 0,
  cartLoading: false,
  cartError: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydratePreferences":
      return { ...state, ...action.state };

    case "cart":
      return {
        ...state,
        lines: action.summary.lines.map(({ id, slug, colorway, size, qty, priceCents }) => ({
          id,
          slug,
          colorway,
          size,
          qty,
          priceCents,
        })),
        checkoutUrl: action.summary.checkoutUrl,
        subtotalCents: action.summary.subtotalCents,
        cartLoading: false,
        cartError: action.summary.error,
        ready: true,
      };

    case "cartLoading":
      return { ...state, cartLoading: true };

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
  add: (line: { slug: string; colorway: ColorwayKey; size: string; qty: number }) => Promise<void>;
  /** Adds every item in a bundle as its own real Shopify line — Shopify has no native "bundle" line item. */
  addBundle: (items: string[]) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  toggleWishlist: (slug: string) => void;
  markViewed: (slug: string) => void;
  setCurrency: (c: CurrencyCode) => void;

  count: number;
  /** Live Shopify subtotal in cents. */
  subtotal: number;

  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  /** Announced politely to screen readers when the cart changes. */
  announcement: string;
}

const StoreContext = createContext<StoreValue | null>(null);

const PREFS_KEY = "chisseled.prefs.v1";

/** `id` is always `slug:colorway:size` — see `lineId` below; none of those three segments ever contain a colon. */
function parseLineId(id: string): { slug: string; colorway: ColorwayKey; size: string } | null {
  const [slug, colorway, size] = id.split(":");
  if (!slug || !colorway || !size) return null;
  return { slug, colorway: colorway as ColorwayKey, size };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // Cart: hydrate from the live Shopify cart (server-side cookie-bound).
  useEffect(() => {
    getCartSummaryAction()
      .then((summary) => dispatch({ type: "cart", summary }))
      .catch(() =>
        dispatch({
          type: "cart",
          summary: { lines: [], subtotalCents: 0, totalCents: 0, checkoutUrl: null, ready: true, error: null },
        }),
      );
  }, []);

  // Preferences (wishlist, recently viewed, display currency) stay local —
  // Shopify has no concept of any of these for a guest session.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      if (raw) dispatch({ type: "hydratePreferences", state: JSON.parse(raw) });
    } catch {
      // Private mode, disabled storage, or corrupt JSON — start clean.
    }
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    try {
      const { wishlist, recent, currency } = state;
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ wishlist, recent, currency }));
    } catch {
      // Storage unavailable — the session still works, it just won't persist.
    }
  }, [state]);

  const add = useCallback(async (line: { slug: string; colorway: ColorwayKey; size: string; qty: number }) => {
    dispatch({ type: "cartLoading" });
    setCartOpen(true);
    const summary = await addLineToCartAction(line);
    dispatch({ type: "cart", summary });
    if (summary.error) {
      setAnnouncement(summary.error);
    } else {
      const p = getProduct(line.slug);
      setAnnouncement(`${p?.name ?? "Item"} added to bag.`);
    }
  }, []);

  const addBundle = useCallback(
    async (items: string[]) => {
      for (const slug of items) {
        const p = getProduct(slug);
        if (!p) continue;
        const size = p.variants[0]?.inStock[0] ?? p.sizes[0];
        if (!size) continue;
        // Sequential, not parallel: each call reads-then-writes the same
        // Shopify cart, and concurrent writes to one cart can race.
        // eslint-disable-next-line no-await-in-loop
        await add({ slug: p.slug, colorway: p.variants[0].colorway, size, qty: 1 });
      }
    },
    [add],
  );

  const remove = useCallback(async (id: string) => {
    const parsed = parseLineId(id);
    if (!parsed) return;
    dispatch({ type: "cartLoading" });
    const summary = await removeLineAction(parsed);
    dispatch({ type: "cart", summary });
    setAnnouncement(summary.error ?? "Item removed from bag.");
  }, []);

  const setQty = useCallback(async (id: string, qty: number) => {
    const parsed = parseLineId(id);
    if (!parsed) return;
    dispatch({ type: "cartLoading" });
    const summary = await updateLineQtyAction({ ...parsed, qty });
    dispatch({ type: "cart", summary });
    if (summary.error) setAnnouncement(summary.error);
  }, []);

  const toggleWishlist = useCallback((slug: string) => {
    dispatch({ type: "wishlist", slug });
  }, []);

  const markViewed = useCallback((slug: string) => {
    dispatch({ type: "viewed", slug });
  }, []);

  const setCurrency = useCallback((currency: CurrencyCode) => {
    dispatch({ type: "currency", currency });
  }, []);

  const count = useMemo(() => state.lines.reduce((n, l) => n + l.qty, 0), [state.lines]);

  const value: StoreValue = {
    ...state,
    add,
    addBundle,
    remove,
    setQty,
    toggleWishlist,
    markViewed,
    setCurrency,
    count,
    subtotal: state.subtotalCents,
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
