# Cardápio — SaaS de cardápio digital e delivery próprio

Plataforma multi-loja em que restaurantes criam seu cardápio digital, recebem pedidos
pelo próprio link (sem comissão de marketplace) e gerenciam tudo num painel.

## Funcionalidades (MVP)

**Para o cliente final** (`/{slug-da-loja}`)
- Cardápio responsivo com busca, categorias, fotos e complementos (tamanho, borda, adicionais...)
- Carrinho salvo no aparelho, separado por loja
- Checkout com entrega por bairro (taxa por bairro) ou retirada, pagamento na entrega
  (dinheiro com troco, cartão ou Pix) e observações
- Página de acompanhamento do pedido com status atualizado automaticamente e botão
  para falar com a loja no WhatsApp

**Para a loja** (`/painel`)
- Cadastro com e-mail e senha, criando a loja e seu endereço (`/minha-loja`)
- Painel de pedidos em tempo real (atualiza a cada 5 s) com aviso sonoro, aceitar →
  preparo → saiu para entrega/pronto → concluído, cancelar, imprimir comanda (80 mm)
  e abrir conversa com o cliente no WhatsApp
- Gestão do cardápio: categorias, produtos, complementos, ordenação, pausar itens
- Configurações: dados da loja, logo/capa/cor, entrega e retirada, pedido mínimo,
  formas de pagamento, chave Pix e bairros atendidos
- Botão para abrir/fechar a loja
- Resumo do dia (pedidos, faturamento, ticket médio)

**Segurança**
- Preços, taxa de entrega e total são sempre recalculados no servidor a partir do banco;
  o navegador envia apenas ids e quantidades (ver `src/lib/pricing.ts` e testes)
- Todas as consultas do painel filtram pela loja do usuário logado (isolamento entre lojas)
- Sessão em cookie httpOnly assinado (JWT HS256), senhas com bcrypt
- Link de acompanhamento usa UUID aleatório

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + React 19 + TypeScript
- PostgreSQL + [Prisma](https://www.prisma.io)
- Tailwind CSS 4
- Vitest (testes unitários)

## Como rodar localmente

Requisitos: Node.js 20+ e PostgreSQL 14+.

```bash
npm install
cp .env.example .env          # ajuste DATABASE_URL e gere um AUTH_SECRET
npm run db:migrate            # cria as tabelas
npm run db:seed               # (opcional) cria a loja de demonstração
npm run dev
```

- Site: http://localhost:3000
- Loja de exemplo: http://localhost:3000/pizzaria-demo
- Painel da loja de exemplo: http://localhost:3000/entrar — `demo@cardapio.dev` / `demo1234`

Para subir só o PostgreSQL com Docker:

```bash
docker run -d --name cardapio-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=cardapio -p 5432:5432 postgres:16
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm test` | Testes unitários |
| `npm run typecheck` | Checagem de tipos |
| `npm run db:migrate` | Cria/aplica migrações em desenvolvimento |
| `npm run db:deploy` | Aplica migrações em produção |
| `npm run db:seed` | Recria a loja de demonstração |
| `npm run db:studio` | Interface visual do banco |

## Estrutura

```
prisma/schema.prisma           modelo de dados
src/app/page.tsx               landing page da plataforma
src/app/(auth)/                cadastro, login e logout
src/app/painel/                painel da loja (pedidos, cardápio, configurações)
src/app/[slug]/                vitrine pública: cardápio, checkout e acompanhamento
src/app/api/                   criação de pedidos e consultas de status
src/lib/pricing.ts             cálculo de preço (servidor) + testes
src/lib/orders.ts              regras de criação de pedido
src/proxy.ts                   proteção das rotas do painel
```

## Próximas fases (roadmap)

1. **Pagamentos:** Pix online com confirmação automática (ex.: Mercado Pago, Asaas), upload de imagens
2. **Operação:** horários de funcionamento automáticos, impressão automática, notificações
   de status para o cliente via WhatsApp, entrega por raio/distância
3. **Marketing:** cupons, cashback/fidelidade, CRM de clientes, disparos de mensagens,
   recuperação de clientes inativos
4. **IA e escala:** atendente de IA no WhatsApp, várias lojas por conta, equipe com permissões,
   assinatura da plataforma (cobrança das lojas), relatórios
