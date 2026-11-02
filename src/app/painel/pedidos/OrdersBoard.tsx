"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { OrderStatus } from "@prisma/client";
import type { PanelOrder } from "@/lib/panelOrders";
import { formatBRL } from "@/lib/money";
import { formatPhone, whatsappLink } from "@/lib/phone";
import {
  NEXT_ACTION_LABEL,
  PAYMENT_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  nextStatus,
} from "@/lib/orderStatus";
import { updateOrderStatus } from "./actions";

const POLL_MS = 5000;

const COLUMNS: { title: string; statuses: OrderStatus[] }[] = [
  { title: "Novos", statuses: ["PENDING"] },
  { title: "Em preparo", statuses: ["PREPARING"] },
  { title: "Prontos / em entrega", statuses: ["READY", "OUT_FOR_DELIVERY"] },
  { title: "Finalizados (24h)", statuses: ["COMPLETED", "CANCELED"] },
];

/** Bipe curto via Web Audio (sem arquivo de som). */
function beep() {
  try {
    const ctx = new AudioContext();
    const play = (at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.25);
    };
    play(0);
    play(0.35);
  } catch {
    // navegador sem suporte ou sem interação ainda: ignora
  }
}

function timeAgo(iso: string, now: number) {
  const min = Math.floor((now - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function OrdersBoard({ initialOrders }: { initialOrders: PanelOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [soundOn, setSoundOn] = useState(false);
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const knownPending = useRef(new Set(initialOrders.filter((o) => o.status === "PENDING").map((o) => o.id)));
  const soundRef = useRef(soundOn);
  soundRef.current = soundOn;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/painel/pedidos", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data: { orders: PanelOrder[] } = await res.json();
      const pending = data.orders.filter((o) => o.status === "PENDING");
      const hasNew = pending.some((o) => !knownPending.current.has(o.id));
      knownPending.current = new Set(pending.map((o) => o.id));
      if (hasNew && soundRef.current) beep();
      setOrders(data.orders);
      setOffline(false);
    } catch {
      setOffline(true);
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  // Título da aba mostra quantos pedidos novos existem.
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  useEffect(() => {
    document.title = pendingCount ? `(${pendingCount}) Pedidos` : "Pedidos";
  }, [pendingCount]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Pedidos</h1>
        {offline && (
          <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            Sem conexão — tentando novamente...
          </span>
        )}
        <button
          type="button"
          className={`ml-auto ${soundOn ? "btn-secondary" : "btn-primary"}`}
          onClick={() => {
            const on = !soundOn;
            setSoundOn(on);
            if (on) beep(); // a interação libera o áudio no navegador
          }}
        >
          {soundOn ? "🔔 Som ativado" : "🔕 Ativar som de novos pedidos"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const list = orders.filter((o) => col.statuses.includes(o.status));
          return (
            <section key={col.title} className="min-w-0">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-600">
                {col.title}
                <span className="rounded-full bg-stone-200 px-2 text-xs">{list.length}</span>
              </h2>
              <div className="space-y-3">
                {list.length === 0 && (
                  <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-sm text-stone-400">
                    Nenhum pedido
                  </p>
                )}
                {list.map((o) => (
                  <OrderCard key={o.id} order={o} now={now} onChanged={refresh} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order: o, now, onChanged }: { order: PanelOrder; now: number; onChanged: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const next = nextStatus(o.status, o.type);
  const finished = o.status === "COMPLETED" || o.status === "CANCELED";

  const change = (to: OrderStatus) =>
    startTransition(async () => {
      const result = await updateOrderStatus(o.id, to);
      setError(result.error);
      onChanged();
    });

  return (
    <article
      className={`card p-4 text-sm ${o.status === "PENDING" ? "border-orange-400 ring-2 ring-orange-200" : ""} ${
        finished ? "opacity-70" : ""
      }`}
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold">#{o.number} · {o.customerName}</p>
          <p className="text-xs text-stone-500">
            {timeAgo(o.createdAt, now)} · {TYPE_LABEL[o.type]}
          </p>
        </div>
        {finished && (
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              o.status === "CANCELED" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
            }`}
          >
            {STATUS_LABEL[o.status]}
          </span>
        )}
        {o.status === "OUT_FOR_DELIVERY" && (
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Em entrega</span>
        )}
      </header>

      <ul className="mb-2 space-y-1">
        {o.items.map((i) => (
          <li key={i.id}>
            <span className="font-semibold">{i.quantity}x</span> {i.name}
            {i.options.length > 0 && (
              <span className="block pl-5 text-xs text-stone-500">{i.options.map((op) => op.name).join(", ")}</span>
            )}
            {i.notes && <span className="block pl-5 text-xs italic text-orange-800">Obs.: {i.notes}</span>}
          </li>
        ))}
      </ul>

      {o.notes && <p className="mb-2 rounded bg-yellow-50 px-2 py-1 text-xs">Obs. do pedido: {o.notes}</p>}

      {o.type === "DELIVERY" && (
        <p className="mb-2 text-xs text-stone-600">
          📍 {o.addressStreet}, {o.addressNumber}
          {o.addressComplement && ` — ${o.addressComplement}`} · {o.zoneName}
          {o.addressReference && <span className="block">Ref.: {o.addressReference}</span>}
        </p>
      )}

      <p className="mb-3 text-xs text-stone-600">
        <b className="text-stone-900">{formatBRL(o.totalCents)}</b> · {PAYMENT_LABEL[o.paymentMethod]}
        {o.changeForCents && ` · troco p/ ${formatBRL(o.changeForCents)}`}
      </p>

      {error && <p className="mb-2 text-xs text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {next && (
          <button type="button" className="btn-primary flex-1 py-1.5" disabled={pending} onClick={() => change(next)}>
            {NEXT_ACTION_LABEL[next]}
          </button>
        )}
        <a href={`/painel/pedidos/${o.id}/imprimir`} target="_blank" rel="noreferrer" className="btn-secondary py-1.5">
          Imprimir
        </a>
        <a
          href={whatsappLink(o.customerPhone)}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary py-1.5"
          title={formatPhone(o.customerPhone)}
        >
          WhatsApp
        </a>
        {!finished && (
          <button
            type="button"
            className="btn-danger py-1.5"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`Cancelar o pedido #${o.number}?`)) change("CANCELED");
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}
