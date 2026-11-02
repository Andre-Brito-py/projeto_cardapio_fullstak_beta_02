"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Storefront, StoreProduct } from "@/lib/menu";
import { formatBRL } from "@/lib/money";
import { useCart } from "./cart";
import { ProductSheet } from "./ProductSheet";

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Menor preço possível do produto, considerando opções obrigatórias. */
function startingPrice(p: StoreProduct) {
  let price = p.priceCents;
  for (const g of p.optionGroups) {
    if (g.minSelect > 0) {
      const cheapest = [...g.options].map((o) => o.priceCents).sort((a, b) => a - b);
      price += cheapest.slice(0, g.minSelect).reduce((s, v) => s + v, 0);
    }
  }
  return price;
}

export function MenuView({ store }: { store: Storefront }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StoreProduct | null>(null);
  const cart = useCart();

  const categories = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return store.categories;
    return store.categories
      .map((c) => ({
        ...c,
        products: c.products.filter((p) => normalize(`${p.name} ${p.description ?? ""}`).includes(q)),
      }))
      .filter((c) => c.products.length > 0);
  }, [query, store.categories]);

  if (store.categories.length === 0) {
    return <p className="px-4 py-12 text-center text-stone-500">O cardápio ainda está sendo montado.</p>;
  }

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="px-4 pt-3">
          <input
            className="input bg-stone-50"
            type="search"
            placeholder="Buscar no cardápio"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <nav className="flex gap-2 overflow-x-auto px-4 py-3">
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#cat-${c.id}`}
              className="whitespace-nowrap rounded-full bg-stone-100 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-200"
            >
              {c.name}
            </a>
          ))}
        </nav>
      </div>

      {categories.length === 0 && (
        <p className="px-4 py-12 text-center text-stone-500">Nada encontrado para &quot;{query}&quot;.</p>
      )}

      {categories.map((c) => (
        <section key={c.id} id={`cat-${c.id}`} className="scroll-mt-32 px-4 pt-6">
          <h2 className="mb-2 text-lg font-bold">{c.name}</h2>
          <ul className="divide-y divide-stone-100">
            {c.products.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  className="flex w-full gap-3 py-4 text-left hover:bg-stone-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{p.name}</p>
                    {p.description && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{p.description}</p>}
                    <p className="mt-2 text-sm font-semibold">
                      {p.optionGroups.some((g) => g.minSelect > 0 && g.options.some((o) => o.priceCents > 0)) && (
                        <span className="font-normal text-stone-500">A partir de </span>
                      )}
                      {formatBRL(startingPrice(p))}
                    </p>
                  </div>
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-xl object-cover" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {selected && (
        <ProductSheet
          product={selected}
          canOrder={store.isOpen}
          onClose={() => setSelected(null)}
          onAdd={(item) => {
            cart.add(item);
            setSelected(null);
          }}
        />
      )}

      {cart.ready && cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 p-3">
          <Link
            href={`/${store.slug}/checkout`}
            className="mx-auto flex max-w-3xl items-center justify-between rounded-xl bg-[var(--brand)] px-5 py-4 font-semibold text-white shadow-lg"
          >
            <span className="rounded-md bg-black/15 px-2 py-0.5 text-sm">{cart.count}</span>
            <span>Ver carrinho</span>
            <span>{formatBRL(cart.subtotalCents)}</span>
          </Link>
        </div>
      )}
    </>
  );
}
