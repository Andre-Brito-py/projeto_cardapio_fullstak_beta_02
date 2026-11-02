import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-6 text-xl font-extrabold tracking-tight">
        Cardápio<span className="text-orange-600">.</span>
      </Link>
      <div className="card w-full max-w-md p-6 sm:p-8">{children}</div>
    </main>
  );
}
