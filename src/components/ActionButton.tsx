"use client";

import { useTransition } from "react";

/** Botão que chama uma server action (já com argumentos via .bind). */
export function ActionButton({
  action,
  children,
  confirm,
  className = "btn-secondary",
  title,
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  confirm?: string;
  className?: string;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {children}
    </button>
  );
}
