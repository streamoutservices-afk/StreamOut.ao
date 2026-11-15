"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { resolveItem } from "@/lib/cart-items";
import { readJSON, removeKey, writeJSON } from "@/lib/storage";

/* ------------------------------- Carrinho ------------------------------- */

export type CartItem = { product: string; plan: string; qty: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: string, plan: string) => void;
  setQty: (product: string, plan: string, qty: number) => void;
  remove: (product: string, plan: string) => void;
  clear: () => void;
  /** incrementa quando algo é adicionado — usado para animar o ícone do carrinho */
  pulse: number;
};

/* ------------------------- Sessão (demo, sem backend) ------------------------- */

export type Session = { name: string; email: string; tier: "essencial" | "plus" | "ultra" | null };

type SessionCtx = {
  session: Session | null;
  ready: boolean;
  signIn: (s: Session) => void;
  signOut: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const SessionContext = createContext<SessionCtx | null>(null);

const CART_KEY = "so.cart.v1";
const SESSION_KEY = "so.session.v1";

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [pulse, setPulse] = useState(0);

  // Hidrata do localStorage depois da montagem (o HTML do servidor é sempre "vazio")
  useEffect(() => {
    setItems(readJSON<CartItem[]>(CART_KEY, []));
    setSession(readJSON<Session | null>(SESSION_KEY, null));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeJSON(CART_KEY, items);
  }, [items, ready]);

  const add = useCallback((product: string, plan: string) => {
    setItems((prev) => {
      const hit = prev.find((i) => i.product === product && i.plan === plan);
      return hit
        ? prev.map((i) => (i === hit ? { ...i, qty: Math.min(i.qty + 1, 10) } : i))
        : [...prev, { product, plan, qty: 1 }];
    });
    setPulse((p) => p + 1);
  }, []);

  const setQty = useCallback((product: string, plan: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product === product && i.plan === plan ? { ...i, qty: Math.max(0, Math.min(qty, 10)) } : i))
        .filter((i) => i.qty > 0),
    );
  }, []);

  const remove = useCallback((product: string, plan: string) => {
    setItems((prev) => prev.filter((i) => !(i.product === product && i.plan === plan)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const cart = useMemo<CartCtx>(() => {
    const subtotal = items.reduce((s, i) => s + (resolveItem(i.product, i.plan, "pt")?.unitKz ?? 0) * i.qty, 0);
    return { items, count: items.reduce((s, i) => s + i.qty, 0), subtotal, add, setQty, remove, clear, pulse };
  }, [items, add, setQty, remove, clear, pulse]);

  const sessionValue = useMemo<SessionCtx>(
    () => ({
      session,
      ready,
      signIn: (s) => {
        setSession(s);
        writeJSON(SESSION_KEY, s);
      },
      signOut: () => {
        setSession(null);
        removeKey(SESSION_KEY);
      },
    }),
    [session, ready],
  );

  return (
    <SessionContext.Provider value={sessionValue}>
      <CartContext.Provider value={cart}>{children}</CartContext.Provider>
    </SessionContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart fora do AppStateProvider");
  return ctx;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession fora do AppStateProvider");
  return ctx;
}

/** Desconto do Bundle activo (5 / 10 / 15 %) */
export function bundlePerk(tier: Session["tier"]) {
  return tier === "ultra" ? 15 : tier === "plus" ? 10 : tier === "essencial" ? 5 : 0;
}
