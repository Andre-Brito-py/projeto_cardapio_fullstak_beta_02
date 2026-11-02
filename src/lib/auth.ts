import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export async function createSession(userId: string) {
  const token = await signSession({ userId });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Usuário logado (ou null). Memoizado por requisição. */
export const getCurrentUser = cache(async () => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
});

/**
 * Loja do usuário logado. Todas as operações do painel passam por aqui, e as
 * consultas sempre filtram por restaurant.id, isolando os dados de cada loja.
 */
export const requireRestaurant = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar");
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { restaurant: true },
  });
  if (!membership) redirect("/cadastro");
  return { user, restaurant: membership.restaurant, role: membership.role };
});
