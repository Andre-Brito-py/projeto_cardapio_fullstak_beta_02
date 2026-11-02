import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Entrar no painel</h1>
      <p className="mb-6 text-sm text-stone-600">Gerencie seu cardápio e seus pedidos.</p>
      <LoginForm next={next} />
      <p className="mt-6 text-center text-sm text-stone-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-semibold text-orange-700 hover:underline">
          Cadastre sua loja
        </Link>
      </p>
    </>
  );
}
