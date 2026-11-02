"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidSlug, slugify } from "@/lib/slug";
import type { FormState } from "@/components/FormMessage";

const signupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(128),
  restaurantName: z.string().trim().min(2, "Informe o nome da loja.").max(80),
  slug: z.string().trim().toLowerCase().optional(),
});

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, password, restaurantName } = parsed.data;
  const slug = slugify(parsed.data.slug || restaurantName);

  if (!isValidSlug(slug)) {
    return { error: "Endereço da loja inválido. Use letras, números e hífens (mín. 3 caracteres)." };
  }
  if (await db.user.findUnique({ where: { email } })) {
    return { error: "Já existe uma conta com este e-mail." };
  }
  if (await db.restaurant.findUnique({ where: { slug } })) {
    return { error: `O endereço "${slug}" já está em uso. Escolha outro.` };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      memberships: {
        create: { role: "OWNER", restaurant: { create: { name: restaurantName, slug } } },
      },
    },
  });

  await createSession(user.id);
  redirect("/painel?bemvindo=1");
}

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
  next: z.string().optional(),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!user || !ok) return { error: "E-mail ou senha incorretos." };

  await createSession(user.id);
  // Só aceita redirecionar para dentro do painel (evita open redirect).
  const next = parsed.data.next;
  redirect(next && next.startsWith("/painel") ? next : "/painel");
}

export async function logout() {
  await destroySession();
  redirect("/entrar");
}
