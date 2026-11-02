"use client";

import { useEffect, useMemo, useState } from "react";
import type { StoreProduct } from "@/lib/menu";
import { formatBRL } from "@/lib/money";
import type { CartItem } from "./cart";

export function ProductSheet({
  product,
  canOrder,
  onClose,
  onAdd,
}: {
  product: StoreProduct;
  canOrder: boolean;
  onClose: () => void;
  onAdd: (item: Omit<CartItem, "key">) => void;
}) {
  const [picked, setPicked] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const toggle = (groupId: string, optionId: string, max: number) => {
    setPicked((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      if (max === 1) return { ...prev, [groupId]: [optionId] };
      if (current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, optionId] };
    });
  };

  const missing = product.optionGroups.filter((g) => (picked[g.id]?.length ?? 0) < g.minSelect);

  const { unitPrice, optionIds, optionNames } = useMemo(() => {
    const ids: string[] = [];
    const names: string[] = [];
    let price = product.priceCents;
    for (const g of product.optionGroups) {
      for (const o of g.options) {
        if (picked[g.id]?.includes(o.id)) {
          ids.push(o.id);
          names.push(o.name);
          price += o.priceCents;
        }
      }
    }
    return { unitPrice: price, optionIds: ids, optionNames: names };
  }, [picked, product]);

  const submit = () => {
    if (missing.length > 0) {
      setShowErrors(true);
      document.getElementById(`group-${missing[0].id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    onAdd({
      productId: product.id,
      name: product.name,
      quantity,
      optionIds,
      optionNames,
      unitPriceCents: unitPrice,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto">
          {product.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt="" className="h-56 w-full object-cover" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold">{product.name}</h2>
              <button type="button" onClick={onClose} className="text-2xl leading-none text-stone-400" aria-label="Fechar">
                ×
              </button>
            </div>
            {product.description && <p className="mt-1 text-sm text-stone-600">{product.description}</p>}
            {product.priceCents > 0 && <p className="mt-2 font-semibold">{formatBRL(product.priceCents)}</p>}
          </div>

          {product.optionGroups.map((g) => {
            const count = picked[g.id]?.length ?? 0;
            const invalid = showErrors && count < g.minSelect;
            const rule =
              g.minSelect > 0
                ? g.minSelect === g.maxSelect
                  ? `Escolha ${g.minSelect}`
                  : `Escolha de ${g.minSelect} a ${g.maxSelect}`
                : `Até ${g.maxSelect}`;
            return (
              <fieldset key={g.id} id={`group-${g.id}`}>
                <legend className={`flex w-full items-center justify-between px-4 py-2 ${invalid ? "bg-red-50" : "bg-stone-100"}`}>
                  <span>
                    <span className="block font-semibold">{g.name}</span>
                    <span className={`text-xs ${invalid ? "text-red-700" : "text-stone-500"}`}>
                      {rule} {g.maxSelect > 1 && `· ${count}/${g.maxSelect}`}
                    </span>
                  </span>
                  {g.minSelect > 0 && (
                    <span className="rounded bg-stone-700 px-2 py-0.5 text-[10px] font-bold uppercase text-white">Obrigatório</span>
                  )}
                </legend>
                {g.options.map((o) => {
                  const checked = picked[g.id]?.includes(o.id) ?? false;
                  const disabled = !checked && g.maxSelect > 1 && count >= g.maxSelect;
                  return (
                    <label
                      key={o.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 ${
                        disabled ? "opacity-40" : ""
                      }`}
                    >
                      <span>
                        <span className="block text-sm">{o.name}</span>
                        {o.priceCents > 0 && <span className="text-xs text-stone-500">+ {formatBRL(o.priceCents)}</span>}
                      </span>
                      <input
                        type={g.maxSelect === 1 ? "radio" : "checkbox"}
                        name={g.id}
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(g.id, o.id, g.maxSelect)}
                        onClick={() => {
                          // Permite desmarcar rádio em grupo opcional.
                          if (g.maxSelect === 1 && checked && g.minSelect === 0) toggle(g.id, o.id, 1);
                        }}
                        className="h-5 w-5 accent-[var(--brand)]"
                      />
                    </label>
                  );
                })}
              </fieldset>
            );
          })}

          <div className="p-4">
            <label className="label" htmlFor="item-notes">Alguma observação?</label>
            <textarea
              id="item-notes"
              className="input min-h-16"
              maxLength={200}
              placeholder="Ex.: sem cebola, ponto da carne..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-stone-200 p-4">
          <div className="flex items-center rounded-lg border border-stone-300">
            <button type="button" className="px-3 py-2 text-lg" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Diminuir">−</button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <button type="button" className="px-3 py-2 text-lg" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Aumentar">+</button>
          </div>
          <button
            type="button"
            disabled={!canOrder}
            onClick={submit}
            className="flex flex-1 items-center justify-between rounded-lg bg-[var(--brand)] px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            <span>{canOrder ? "Adicionar" : "Loja fechada"}</span>
            <span>{formatBRL(unitPrice * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
