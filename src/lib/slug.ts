// Rotas da plataforma que não podem ser usadas como endereço de loja.
export const RESERVED_SLUGS = new Set([
  "api", "painel", "entrar", "cadastro", "sair", "admin", "app", "www",
  "static", "_next", "favicon.ico", "robots.txt", "sitemap.xml", "planos",
  "suporte", "ajuda", "termos", "privacidade", "login", "logout", "signup",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(slug) && !RESERVED_SLUGS.has(slug);
}
