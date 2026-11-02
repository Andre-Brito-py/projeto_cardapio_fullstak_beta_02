"use client";

import { useActionState, useState } from "react";
import { signup } from "../actions";
import { FormMessage } from "@/components/FormMessage";
import { SubmitButton } from "@/components/SubmitButton";
import { slugify } from "@/lib/slug";

export function SignupForm({ appUrl }: { appUrl: string }) {
  const [state, action] = useActionState(signup, undefined);
  const [restaurantName, setRestaurantName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const effectiveSlug = slugTouched ? slug : slugify(restaurantName);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">Seu nome</label>
        <input className="input" id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <label className="label" htmlFor="email">E-mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Senha</label>
        <input className="input" id="password" name="password" type="password" minLength={8} autoComplete="new-password" required />
        <p className="mt-1 text-xs text-stone-500">Mínimo de 8 caracteres.</p>
      </div>
      <hr className="border-stone-200" />
      <div>
        <label className="label" htmlFor="restaurantName">Nome da loja</label>
        <input
          className="input"
          id="restaurantName"
          name="restaurantName"
          required
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
        />
      </div>
      <div>
        <label className="label" htmlFor="slug">Endereço do cardápio</label>
        <div className="flex items-center overflow-hidden rounded-lg border border-stone-300 bg-white focus-within:ring-2 focus-within:ring-stone-200">
          <span className="shrink-0 border-r border-stone-200 bg-stone-100 px-3 py-2 text-sm text-stone-500">
            {appUrl.replace(/^https?:\/\//, "")}/
          </span>
          <input
            className="w-full min-w-0 px-3 py-2 text-sm outline-none"
            id="slug"
            name="slug"
            value={effectiveSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            required
          />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton className="btn-primary w-full" pendingText="Criando...">Criar minha loja</SubmitButton>
    </form>
  );
}
