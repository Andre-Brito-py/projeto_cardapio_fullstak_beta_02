"use client";

import { useEffect, useState } from "react";
import type { OrderStatus, OrderType } from "@prisma/client";
import { STATUS_LABEL, trackingSteps } from "@/lib/orderStatus";

const POLL_MS = 10000;

export function StatusTracker({
  orderId,
  type,
  initialStatus,
}: {
  orderId: string;
  type: OrderType;
  initialStatus: OrderStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const done = status === "COMPLETED" || status === "CANCELED";

  useEffect(() => {
    if (done) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/pedidos/${orderId}`, { cache: "no-store" });
        if (res.ok) setStatus((await res.json()).status);
      } catch {}
    }, POLL_MS);
    return () => clearInterval(id);
  }, [orderId, done]);

  if (status === "CANCELED") {
    return (
      <div className="card border-red-200 bg-red-50 p-4 text-center">
        <p className="font-semibold text-red-800">Pedido cancelado</p>
        <p className="text-sm text-red-700">Fale com a loja para mais informações.</p>
      </div>
    );
  }

  const steps = trackingSteps(type);
  const current = steps.indexOf(status);

  return (
    <ol className="card space-y-0 p-4" aria-live="polite">
      {steps.map((step, i) => {
        const reached = i <= current;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  reached ? "bg-[var(--brand)] text-white" : "bg-stone-200 text-stone-500"
                }`}
              >
                {i < current || status === "COMPLETED" ? "✓" : i + 1}
              </span>
              {i < steps.length - 1 && <span className={`h-6 w-0.5 ${i < current ? "bg-[var(--brand)]" : "bg-stone-200"}`} />}
            </div>
            <p className={`pt-0.5 text-sm ${i === current ? "font-bold" : reached ? "" : "text-stone-400"}`}>
              {step === "COMPLETED"
                ? type === "DELIVERY" ? "Entregue" : "Retirado"
                : step === "PENDING" && i < current
                  ? "Pedido confirmado"
                  : STATUS_LABEL[step]}
              {i === current && status !== "COMPLETED" && (
                <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--brand)]" />
              )}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
