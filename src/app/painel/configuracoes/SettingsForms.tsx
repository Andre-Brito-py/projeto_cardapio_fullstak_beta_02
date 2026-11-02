"use client";

import { useActionState, useEffect, useRef } from "react";
import type { Restaurant } from "@prisma/client";
import { createZone, saveSettings } from "./actions";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { centsToInput } from "@/lib/money";
import { formatPhone } from "@/lib/phone";

function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}

export function SettingsForm({ restaurant: r }: { restaurant: Restaurant }) {
  const [state, action] = useActionState(saveSettings, undefined);

  return (
    <form action={action} className="space-y-6">
      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Loja</h2>
        <div>
          <label className="label" htmlFor="name">Nome</label>
          <input className="input" id="name" name="name" defaultValue={r.name} maxLength={80} required />
        </div>
        <div>
          <label className="label" htmlFor="description">Descrição curta</label>
          <input className="input" id="description" name="description" defaultValue={r.description ?? ""} maxLength={300} placeholder="Ex.: Pizzas artesanais no forno a lenha" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="whatsapp">WhatsApp da loja</label>
            <input className="input" id="whatsapp" name="whatsapp" type="tel" defaultValue={r.whatsapp ? formatPhone(r.whatsapp) : ""} placeholder="(11) 98765-4321" />
          </div>
          <div>
            <label className="label" htmlFor="address">Endereço</label>
            <input className="input" id="address" name="address" defaultValue={r.address ?? ""} maxLength={200} placeholder="Usado para retirada" />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Aparência</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="logoUrl">URL do logo</label>
            <input className="input" id="logoUrl" name="logoUrl" type="url" defaultValue={r.logoUrl ?? ""} placeholder="https://..." />
          </div>
          <div>
            <label className="label" htmlFor="coverUrl">URL da capa</label>
            <input className="input" id="coverUrl" name="coverUrl" type="url" defaultValue={r.coverUrl ?? ""} placeholder="https://..." />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="primaryColor">Cor principal</label>
          <input className="h-10 w-20 cursor-pointer rounded border border-stone-300" id="primaryColor" name="primaryColor" type="color" defaultValue={r.primaryColor} />
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Atendimento</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Check name="acceptsDelivery" label="Fazemos entrega" defaultChecked={r.acceptsDelivery} />
            <input className="input" name="deliveryEstimate" defaultValue={r.deliveryEstimate ?? ""} placeholder="Tempo de entrega (ex.: 40-60 min)" maxLength={30} />
          </div>
          <div className="space-y-2">
            <Check name="acceptsPickup" label="Cliente pode retirar na loja" defaultChecked={r.acceptsPickup} />
            <input className="input" name="pickupEstimate" defaultValue={r.pickupEstimate ?? ""} placeholder="Tempo para retirada (ex.: 20 min)" maxLength={30} />
          </div>
        </div>
        <div className="max-w-xs">
          <label className="label" htmlFor="minOrder">Pedido mínimo (R$)</label>
          <input className="input" id="minOrder" name="minOrder" inputMode="decimal" defaultValue={r.minOrderCents ? centsToInput(r.minOrderCents) : ""} placeholder="0,00" />
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Pagamento</h2>
        <p className="text-sm text-stone-600">Formas de pagamento aceitas na entrega ou retirada.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check name="acceptsCash" label="Dinheiro" defaultChecked={r.acceptsCash} />
          <Check name="acceptsCard" label="Cartão (maquininha)" defaultChecked={r.acceptsCard} />
          <Check name="acceptsPix" label="Pix" defaultChecked={r.acceptsPix} />
        </div>
        <div>
          <label className="label" htmlFor="pixKey">Chave Pix</label>
          <input className="input" id="pixKey" name="pixKey" defaultValue={r.pixKey ?? ""} maxLength={100} placeholder="CNPJ, e-mail, telefone ou chave aleatória" />
          <p className="mt-1 text-xs text-stone-500">Mostrada ao cliente que escolher Pix.</p>
        </div>
      </section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-stone-200 bg-stone-50/95 py-3 backdrop-blur">
        <SubmitButton>Salvar configurações</SubmitButton>
        <div className="flex-1"><FormMessage state={state} /></div>
      </div>
    </form>
  );
}

export function ZoneCreateForm() {
  const [state, action] = useActionState(createZone, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) {
      ref.current?.reset();
      ref.current?.querySelector<HTMLInputElement>("input[name=name]")?.focus();
    }
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input className="input min-w-40 flex-1" name="name" placeholder="Bairro (ex.: Centro)" maxLength={80} required />
        <input className="input w-32" name="fee" inputMode="decimal" placeholder="Taxa R$ 0,00" />
        <SubmitButton className="btn-secondary" pendingText="...">Adicionar</SubmitButton>
      </div>
      {state?.error && <FormMessage state={state} />}
    </form>
  );
}
