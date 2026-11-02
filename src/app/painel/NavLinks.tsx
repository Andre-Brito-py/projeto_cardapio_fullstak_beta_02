"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/painel", label: "Início", exact: true },
  { href: "/painel/pedidos", label: "Pedidos" },
  { href: "/painel/cardapio", label: "Cardápio" },
  { href: "/painel/configuracoes", label: "Configurações" },
];

export function NavLinks({ slug }: { slug: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:px-2">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${
              active ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      <a
        href={`/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
      >
        Ver minha loja ↗
      </a>
    </nav>
  );
}
