"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { createCategory, renameCategory } from "./actions";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";

export function CategoryCreateForm() {
  const [state, action] = useActionState(createCategory, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.success) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-2">
      <div className="flex gap-2">
        <input className="input" name="name" placeholder="Ex.: Pizzas" maxLength={60} required />
        <SubmitButton pendingText="Criando...">Criar</SubmitButton>
      </div>
      {state?.error && <FormMessage state={state} />}
    </form>
  );
}

export function CategoryName({ id, name }: { id: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [, startTransition] = useTransition();

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="font-semibold hover:underline" title="Renomear">
        {name}
      </button>
    );
  }
  const save = () => {
    setEditing(false);
    if (value.trim() && value !== name) startTransition(() => renameCategory(id, value));
  };
  return (
    <input
      autoFocus
      className="input max-w-xs py-1"
      value={value}
      maxLength={60}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") {
          setValue(name);
          setEditing(false);
        }
      }}
    />
  );
}
