import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-extrabold">404</p>
      <p className="mt-2 text-stone-600">Página não encontrada.</p>
      <Link href="/" className="btn-primary mt-6">Voltar ao início</Link>
    </main>
  );
}
