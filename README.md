# Care — Plataforma de Cursos e Treinamentos

Substituto interno da Hotmart para treinamentos corporativos (~70 usuários, sem venda).
Contexto completo em [`LLMS - Care.md`](./LLMS%20-%20Care.md) e [`plano-desenvolvimento.md`](./plano-desenvolvimento.md).

## Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS v4
- **Backend/banco**: Supabase (Postgres + Auth + Storage), Row Level Security por `empresa_id`
- **Vídeo**: Cloudflare Stream (upload direto do navegador, tracking de progresso via player)
- **Deploy**: Vercel

## Design system — "Care Terra"

Tokens em [`src/app/globals.css`](./src/app/globals.css), componentes em [`src/design-system`](./src/design-system)
(atoms/molecules/organisms). Combina a paleta terrosa e a tipografia serifada acolhedora
do design system do projeto GSC com a arquitetura de componentes e o raio de cartão
generoso do Sistema Agência.

## Setup local

```bash
npm install
cp .env.local.example .env.local   # preencher com as chaves do Supabase e Cloudflare Stream
npm run dev
```

Sem as variáveis do Supabase preenchidas, o app roda normalmente (proxy de auth faz no-op),
mas telas que dependem de login ainda não existem (ver Fase 1).

## Banco de dados

Schema completo com RLS em [`supabase/schema.sql`](./supabase/schema.sql). Para aplicar:

```bash
# depois de criar o projeto em supabase.com e configurar o .env.local
npx supabase db push --db-url "$SUPABASE_DB_URL"
# ou: colar o conteúdo do schema.sql no SQL Editor do painel do Supabase
```

## Estrutura de pastas

```
src/
  app/                 rotas (App Router)
  design-system/       atoms / molecules / organisms
  lib/supabase/        clients (browser e server)
  proxy.ts             renovação de sessão Supabase (convenção "proxy" do Next.js 16)
supabase/
  schema.sql           schema + RLS
```

## Fases de desenvolvimento

Ver [`plano-desenvolvimento.md`](./plano-desenvolvimento.md). Concluída: **Fase 0**
(projeto Next.js, tokens de design, schema do banco). Próxima: **Fase 1** — autenticação
com papéis admin/aluno.
