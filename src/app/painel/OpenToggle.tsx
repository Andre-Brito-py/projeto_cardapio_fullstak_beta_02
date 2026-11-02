"use client";

import { useOptimistic, useTransition } from "react";
import { setOpen } from "./actions";

export function OpenToggle({ isOpen }: { isOpen: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(isOpen);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setOpen(!optimistic);
        })
      }
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
        optimistic ? "bg-green-100 text-green-800" : "bg-stone-200 text-stone-700"
      }`}
      title="Clique para abrir ou fechar a loja"
    >
      <span className={`h-2 w-2 rounded-full ${optimistic ? "bg-green-600" : "bg-stone-500"}`} />
      {optimistic ? "Loja aberta" : "Loja fechada"}
    </button>
  );
}
