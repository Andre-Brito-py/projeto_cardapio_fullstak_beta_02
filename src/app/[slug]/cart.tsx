"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  key: string;
  productId: string;
  name: string;
  quantity: number;
  optionIds: string[];
  optionNames: string[];
  /** Apenas para exibição. O valor real é calculado no servidor. */
  unitPriceCents: number;
  notes?: string;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Um carrinho por loja: a chave inclui o slug, então itens de uma loja nunca
// aparecem em outra.
const storageKey = (slug: string) => `cart:${slug}`;

export function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // armazenamento indisponível ou corrompido: começa vazio
    }
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey(slug), JSON.stringify(items));
    } catch {
      // ignora (modo privado, cota cheia...)
    }
  }, [items, ready, slug]);

  const add = useCallback((item: Omit<CartItem, "key">) => {
    setItems((prev) => {
      // Mesmo produto com as mesmas escolhas e observação: soma a quantidade.
      const same = prev.find(
        (p) =>
          p.productId === item.productId &&
          (p.notes ?? "") === (item.notes ?? "") &&
          p.optionIds.join() === item.optionIds.join(),
      );
      if (same) {
        return prev.map((p) =>
          p === same ? { ...p, quantity: Math.min(99, p.quantity + item.quantity) } : p,
        );
      }
      return [...prev, { ...item, key: crypto.randomUUID() }];
    });
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotalCents: items.reduce((s, i) => s + i.unitPriceCents * i.quantity, 0),
      add,
      setQuantity: (key, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((i) => i.key !== key)
            : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(99, quantity) } : i)),
        ),
      remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      replace: setItems,
      clear: () => setItems([]),
    }),
    [items, ready, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}
