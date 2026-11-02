import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Cadastre sua loja" };

export default function SignupPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Cadastre sua loja</h1>
      <p className="mb-6 text-sm text-stone-600">Seu cardápio digital no ar em poucos minutos.</p>
      <SignupForm appUrl={appUrl} />
      <p className="mt-6 text-center text-sm text-stone-600">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-orange-700 hover:underline">Entrar</Link>
      </p>
    </>
  );
}
