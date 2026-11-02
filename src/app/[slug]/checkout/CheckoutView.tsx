"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Storefront } from "@/lib/menu";
import { formatBRL, parseBRL } from "@/lib/money";
import { PAYMENT_LABEL } from "@/lib/orderStatus";
import { normalizeBRPhone } from "@/lib/phone";
import { priceItems, PricingError, type MenuProduct } from "@/lib/pricing";
import { useCart } from "../cart";

type Payment = "CASH" | "CARD" | "PIX";
type Customer = {
  name: string;
  phone: string;
  zoneId: string;
  street: string;
  number: string;
  complement: string;
  reference: string;
};

const CUSTOMER_KEY = "customer";
const emptyCustomer: Customer = { name: "", phone: "", zoneId: "", street: "", number: "", complement: "", reference: "" };

function buildMenu(store: Storefront): Map<string, MenuProduct> {
  const map = new Map<string, MenuProduct>();
  for (const c of store.categories) {
    for (const p of c.products) {
      map.set(p.id, {
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        active: true,
        categoryActive: true,
        optionGroups: p.optionGroups.map((g) => ({ ...g, options: g.options.map((o) => ({ ...o, active: true })) })),
      });
    }
  }
  return map;
}

export function CheckoutView({ store }: { store: Storefront }) {
  const cart = useCart();
  const router = useRouter();
  const menu = useMemo(() => buildMenu(store), [store]);

  const [type, setType] = useState<"DELIVERY" | "PICKUP">(store.acceptsDelivery ? "DELIVERY" : "PICKUP");
  const payments = (["PIX", "CARD", "CASH"] as Payment[]).filter(
    (p) => ({ CASH: store.acceptsCash, CARD: store.acceptsCard, PIX: store.acceptsPix })[p],
  );
  const [payment, setPayment] = useState<Payment | "">(payments.length === 1 ? payments[0] : "");
  const [changeFor, setChangeFor] = useState("");
  const [notes, setNotes] = useState("");
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const reconciled = useRef(false);

  // Dados do cliente lembrados neste aparelho.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_KEY);
      if (saved) setCustomer({ ...emptyCustomer, ...JSON.parse(saved), zoneId: "" });
    } catch {}
  }, []);

  // Confere o carrinho salvo contra o cardápio atual: remove itens que saíram
  // do cardápio e atualiza preços que mudaram.
  useEffect(() => {
    if (!cart.ready || reconciled.current) return;
    reconciled.current = true;
    let changed = false;
    const valid = cart.items.flatMap((item) => {
      try {
        const [priced] = priceItems(menu, [item]).items;
        if (priced.unitPriceCents !== item.unitPriceCents) changed = true;
        return [{ ...item, unitPriceCents: priced.unitPriceCents }];
      } catch (e) {
        if (e instanceof PricingError) {
          changed = true;
          return [];
        }
        throw e;
      }
    });
    if (changed) {
      cart.replace(valid);
      setNotice("Alguns itens do seu carrinho mudaram de preço ou não estão mais disponíveis. Confira antes de enviar.");
    }
  }, [cart, menu]);

  const zone = store.zones.find((z) => z.id === customer.zoneId);
  const deliveryFee = type === "DELIVERY" ? (zone?.feeCents ?? 0) : 0;
  const total = cart.subtotalCents + deliveryFee;
  const belowMinimum = cart.subtotalCents < store.minOrderCents;
  const set = (k: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCustomer((c) => ({ ...c, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (!normalizeBRPhone(customer.phone)) return setError("Informe um telefone válido com DDD.");
    if (!payment) return setError("Escolha a forma de pagamento.");
    if (type === "DELIVERY" && !zone) return setError("Escolha o bairro de entrega.");
    let changeForCents: number | undefined;
    if (payment === "CASH" && changeFor.trim()) {
      const cents = parseBRL(changeFor);
      if (cents === null || cents < total) return setError("O troco precisa ser para um valor maior que o total.");
      changeForCents = cents;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/lojas/${store.slug}/pedidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          customerPhone: customer.phone,
          type,
          zoneId: type === "DELIVERY" ? customer.zoneId : undefined,
          address:
            type === "DELIVERY"
              ? { street: customer.street, number: customer.number, complement: customer.complement, reference: customer.reference }
              : undefined,
          paymentMethod: payment,
          changeForCents,
          notes: notes.trim() || undefined,
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            optionIds: i.optionIds,
            notes: i.notes,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Não foi possível enviar o pedido.");
        setSubmitting(false);
        return;
      }
      try {
        const { zoneId: _z, ...toSave } = customer;
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify(toSave));
      } catch {}
      cart.clear();
      router.replace(`/${store.slug}/pedido/${data.id}`);
    } catch {
      setError("Sem conexão. Verifique sua internet e tente novamente.");
      setSubmitting(false);
    }
  }

  if (cart.ready && cart.items.length === 0 && !submitting) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="mb-4 text-stone-600">Seu carrinho está vazio.</p>
        <Link href={`/${store.slug}`} className="btn-primary">Ver cardápio</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-4 px-4 py-6 pb-32">
      <div className="flex items-center gap-3">
        <Link href={`/${store.slug}`} className="text-2xl leading-none text-stone-500" aria-label="Voltar">←</Link>
        <h1 className="text-xl font-bold">Finalizar pedido</h1>
      </div>

      {notice && <p className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-900">{notice}</p>}
      {!store.isOpen && (
        <p className="rounded-lg bg-stone-200 px-3 py-2 text-sm">A loja está fechada no momento e não está recebendo pedidos.</p>
      )}

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Seu pedido</h2>
        <ul className="divide-y divide-stone-100">
          {cart.items.map((item) => (
            <li key={item.key} className="flex gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                {item.optionNames.length > 0 && <p className="text-xs text-stone-500">{item.optionNames.join(", ")}</p>}
                {item.notes && <p className="text-xs italic text-stone-500">Obs.: {item.notes}</p>}
                <p className="mt-1 text-sm font-semibold">{formatBRL(item.unitPriceCents * item.quantity)}</p>
              </div>
              <div className="flex h-9 items-center self-center rounded-lg border border-stone-300">
                <button type="button" className="px-3" onClick={() => cart.setQuantity(item.key, item.quantity - 1)} aria-label="Diminuir">
                  {item.quantity === 1 ? "🗑" : "−"}
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button type="button" className="px-3" onClick={() => cart.setQuantity(item.key, item.quantity + 1)} aria-label="Aumentar">+</button>
              </div>
            </li>
          ))}
        </ul>
        <Link href={`/${store.slug}`} className="mt-2 inline-block text-sm font-semibold text-[var(--brand)]">
          + Adicionar mais itens
        </Link>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Seus dados</h2>
        <input className="input" placeholder="Nome" value={customer.name} onChange={set("name")} required minLength={2} maxLength={80} autoComplete="name" />
        <input className="input" placeholder="WhatsApp com DDD" type="tel" value={customer.phone} onChange={set("phone")} required autoComplete="tel" />
      </section>

      {store.acceptsDelivery && store.acceptsPickup && (
        <section className="card grid grid-cols-2 gap-2 p-2">
          {(["DELIVERY", "PICKUP"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg py-2 text-sm font-semibold ${type === t ? "bg-[var(--brand)] text-white" : "text-stone-600"}`}
            >
              {t === "DELIVERY" ? "Entrega" : "Retirada"}
            </button>
          ))}
        </section>
      )}

      {type === "DELIVERY" ? (
        <section className="card space-y-3 p-4">
          <h2 className="font-semibold">Endereço de entrega</h2>
          {store.zones.length === 0 ? (
            <p className="text-sm text-red-700">A loja ainda não configurou os bairros de entrega.</p>
          ) : (
            <select className="input" value={customer.zoneId} onChange={set("zoneId")} required>
              <option value="">Selecione o bairro</option>
              {store.zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} — {z.feeCents ? formatBRL(z.feeCents) : "grátis"}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Rua" value={customer.street} onChange={set("street")} required maxLength={150} autoComplete="address-line1" />
            <input className="input w-24" placeholder="Nº" value={customer.number} onChange={set("number")} required maxLength={20} />
          </div>
          <input className="input" placeholder="Complemento (apto, bloco...)" value={customer.complement} onChange={set("complement")} maxLength={100} />
          <input className="input" placeholder="Ponto de referência" value={customer.reference} onChange={set("reference")} maxLength={150} />
          {store.deliveryEstimate && <p className="text-xs text-stone-500">Tempo estimado: {store.deliveryEstimate}</p>}
        </section>
      ) : (
        <section className="card p-4 text-sm">
          <h2 className="mb-1 font-semibold">Retirada na loja</h2>
          {store.address && <p className="text-stone-600">{store.address}</p>}
          {store.pickupEstimate && <p className="text-xs text-stone-500">Pronto em: {store.pickupEstimate}</p>}
        </section>
      )}

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Pagamento <span className="text-xs font-normal text-stone-500">(na {type === "DELIVERY" ? "entrega" : "retirada"})</span></h2>
        <div className="grid gap-2">
          {payments.map((p) => (
            <label key={p} className="flex cursor-pointer items-center gap-3 rounded-lg border border-stone-200 px-3 py-2 text-sm">
              <input type="radio" name="payment" checked={payment === p} onChange={() => setPayment(p)} className="h-4 w-4 accent-[var(--brand)]" />
              {PAYMENT_LABEL[p]}
            </label>
          ))}
        </div>
        {payment === "CASH" && (
          <input className="input" inputMode="decimal" placeholder="Troco para quanto? (opcional)" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} />
        )}
        {payment === "PIX" && store.pixKey && (
          <p className="rounded-lg bg-stone-100 px-3 py-2 text-sm">
            Chave Pix da loja: <b className="break-all">{store.pixKey}</b>
          </p>
        )}
      </section>

      <section className="card p-4">
        <label className="label" htmlFor="order-notes">Observações do pedido</label>
        <input id="order-notes" className="input" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: interfone quebrado, ligar ao chegar" />
      </section>

      <section className="card space-y-1 p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{formatBRL(cart.subtotalCents)}</span></div>
        {type === "DELIVERY" && (
          <div className="flex justify-between">
            <span>Taxa de entrega</span>
            <span>{zone ? (zone.feeCents ? formatBRL(zone.feeCents) : "Grátis") : "—"}</span>
          </div>
        )}
        <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{formatBRL(total)}</span></div>
        {belowMinimum && (
          <p className="pt-1 text-red-700">Pedido mínimo: {formatBRL(store.minOrderCents)}.</p>
        )}
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white p-3">
        <button
          type="submit"
          disabled={submitting || !store.isOpen || belowMinimum || !cart.ready}
          className="mx-auto flex w-full max-w-lg items-center justify-between rounded-xl bg-[var(--brand)] px-5 py-4 font-semibold text-white disabled:opacity-50"
        >
          <span>{submitting ? "Enviando..." : "Enviar pedido"}</span>
          <span>{formatBRL(total)}</span>
        </button>
      </div>
    </form>
  );
}
