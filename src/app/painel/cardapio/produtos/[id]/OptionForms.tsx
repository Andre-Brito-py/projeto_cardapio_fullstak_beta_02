"use client";

import { useActionState, useEffect, useRef } from "react";
import { createOption, saveOptionGroup } from "../../actions";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

type Group = { id: string; name: string; minSelect: number; maxSelect: number };

export function GroupForm({ productId, group }: { productId: string; group?: Group }) {
  const [state, action] = useActionState(saveOptionGroup, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success && !group) ref.current?.reset();
  }, [state, group]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="productId" value={productId} />
      {group && <input type="hidden" name="groupId" value={group.id} />}
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1">
          <label className="label text-xs">Nome do grupo</label>
          <input className="input" name="name" defaultValue={group?.name} placeholder="Ex.: Tamanho" maxLength={60} required />
        </div>
        <div className="w-20">
          <label className="label text-xs">Mínimo</label>
          <input className="input" name="minSelect" type="number" min={0} max={20} defaultValue={group?.minSelect ?? 0} required />
        </div>
        <div className="w-20">
          <label className="label text-xs">Máximo</label>
          <input className="input" name="maxSelect" type="number" min={1} max={20} defaultValue={group?.maxSelect ?? 1} required />
        </div>
        <SubmitButton className="btn-secondary" pendingText="...">{group ? "Salvar" : "Criar grupo"}</SubmitButton>
      </div>
      {state?.error && <FormMessage state={state} />}
    </form>
  );
}

export function OptionCreateForm({ groupId }: { groupId: string }) {
  const [state, action] = useActionState(createOption, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) {
      ref.current?.reset();
      ref.current?.querySelector<HTMLInputElement>("input[name=name]")?.focus();
    }
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <input type="hidden" name="groupId" value={groupId} />
      <div className="flex flex-wrap gap-2">
        <input className="input min-w-40 flex-1" name="name" placeholder="Nova opção (ex.: Grande)" maxLength={60} required />
        <input className="input w-28" name="price" inputMode="decimal" placeholder="+ R$ 0,00" />
        <SubmitButton className="btn-secondary" pendingText="...">Adicionar</SubmitButton>
      </div>
      {state?.error && <FormMessage state={state} />}
    </form>
  );
}
