import Link from "next/link";

const features = [
  {
    title: "Cardápio digital",
    text: "Link próprio da sua loja com fotos, categorias, tamanhos e adicionais. Funciona em qualquer celular.",
  },
  {
    title: "Sem comissão por pedido",
    text: "O cliente pede direto com você. Nada de repassar 20% de cada venda para aplicativo.",
  },
  {
    title: "Painel de pedidos",
    text: "Pedidos chegam em tempo real com aviso sonoro. Aceite, prepare e despache com um clique.",
  },
  {
    title: "Entrega por bairro",
    text: "Defina os bairros atendidos e a taxa de cada um. Retirada no balcão também.",
  },
  {
    title: "Acompanhamento do pedido",
    text: "O cliente acompanha o status pelo link, e pode falar com a loja pelo WhatsApp.",
  },
  {
    title: "Preço sempre correto",
    text: "Os valores são calculados no servidor a partir do seu cardápio. Ninguém altera preço pelo navegador.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-xl font-extrabold tracking-tight">
          Cardápio<span className="text-orange-600">.</span>
        </span>
        <nav className="flex items-center gap-2">
          <Link href="/entrar" className="btn-secondary">Entrar</Link>
          <Link href="/cadastro" className="btn-primary">Criar loja</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 text-center sm:pt-20">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
          Seu delivery próprio, <span className="text-orange-600">sem comissão</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-stone-600">
          Cardápio digital e sistema de pedidos para pizzarias, hamburguerias, lanchonetes e
          restaurantes venderem direto para seus clientes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/cadastro" className="btn-primary px-6 py-3 text-base">Criar minha loja grátis</Link>
          <Link href="/pizzaria-demo" className="btn-secondary px-6 py-3 text-base">Ver cardápio de exemplo</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="card p-6">
            <h2 className="mb-2 font-bold">{f.title}</h2>
            <p className="text-sm text-stone-600">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
