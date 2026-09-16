<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projeto: Care

LMS interno do Grupo Care Anestesia, substituindo a Hotmart pra treinamentos corporativos
(~70 usuários, sem venda/checkout). Contexto original e decisões de arquitetura em
[`LLMS - Care.md`](./LLMS%20-%20Care.md); plano faseado em [`plano-desenvolvimento.md`](./plano-desenvolvimento.md);
histórico cronológico do que foi construído (só até a Fase 9) em
[`historico-desenvolvimento.md`](./historico-desenvolvimento.md); auditoria de paridade
com a Hotmart em [`auditoria-hotmart.md`](./auditoria-hotmart.md). Nenhum desses três
está 100% atualizado com o que vem depois deste arquivo — trate como histórico, não
como fonte da verdade do estado atual do código.

**Produção**: https://lms-care.vercel.app (deploy automático a cada push em `main`)
**Repositório**: https://github.com/rebfreire/lms-care

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 — **leia o aviso do topo deste
  arquivo**, essa versão tem mudanças que não batem com conhecimento de treino
- Supabase: Postgres + Auth (e-mail/senha) + Storage, tudo via Row Level Security por
  `empresa_id` (multi-tenant pronto, só um tenant real hoje)
- Cloudflare Stream pra hospedagem/player de vídeo (upload direto do navegador, TUS
  resumível pra arquivos grandes)
- pdf-lib pra gerar certificado em PDF server-side
- Tiptap pro editor de texto rico (texto de apoio da aula)
- SendGrid como SMTP customizado do Supabase Auth (ver seção de e-mail abaixo)

## Comandos

```bash
npm run dev      # dev server
npm run build    # build de produção — sempre rode antes de dar push em algo sensível
npm run lint     # eslint
npx tsc --noEmit # typecheck
```

## Banco de dados — como migrações funcionam aqui

`supabase/schema.sql` é o schema base (só usado pra recriar o banco do zero via
`supabase/reset.sql`). Todo o resto do histórico do banco está em
`supabase/migrations/NNN_*.sql`, aplicado **manualmente** pelo usuário no SQL Editor do
Supabase — **eu não tenho acesso a psql/CLI do Supabase pra rodar migração sozinho**,
só a chave de service role (que dá pra ler/escrever linhas, não rodar DDL/alterar
Auth/Storage config). O fluxo padrão quando uma mudança precisa de schema novo:

1. Escrevo a migração em `supabase/migrations/NNN_descricao.sql`
2. Peço pro usuário rodar no SQL Editor do Supabase (painel do projeto)
3. Confirmo rodando uma query de leitura contra a coluna/tabela nova antes de continuar
   codando em cima dela — nunca assumo que já rodou

`schema.sql` nunca foi atualizado retroativamente com as migrações — não uso ele como
referência do estado atual, uso as migrações em ordem.

## Padrões importantes do código

- **RLS e o client admin**: a maioria das tabelas tem RLS por `empresa_id`, mas algumas
  (ex.: `empresas`) só têm policy de `SELECT`, sem `UPDATE`. Escritas que passam por RLS
  bloqueado, ou que mexem em Storage/Auth admin (upload de imagem, criar usuário, gerar
  link de senha pra outra pessoa), usam `createAdminClient()` de `@/lib/supabase/admin`
  (service role, bypassa RLS) — só depois de checar `usuario.papel === "admin"` no
  código, já que o bypass não tem proteção própria.
- **Normalização Unicode (NFC vs NFD)**: nomes vindos de import/CSV do cliente às vezes
  chegam em NFD (acento decomposto, ex. `Assepsia e Higiene das Mãos` com "a" + til
  combinável). Isso é invisível no navegador mas quebra libs como pdf-lib (`WinAnsi
  cannot encode`). `src/lib/certificado.ts` normaliza pra NFC antes de desenhar texto no
  PDF; ao mexer com nomes de curso/usuário/empresa em contexto novo, considere o mesmo.
- **E-mail de acesso pra OUTRA pessoa (não quem está logado)**: `criarUsuarioManual` e
  `enviarEmailAcesso` (ambos em `src/app/admin/usuarios/actions.ts`) mandam a senha
  provisória **direto no corpo do e-mail** (via `src/lib/email.ts`, API do SendGrid por
  `fetch`, sem passar pelo Supabase Auth) em vez de um link de redefinição — o usuário
  troca depois se quiser em "Trocar senha" na sidebar (`/redefinir-senha`, que só exige
  sessão ativa, não é mais exclusivo de fluxo de recuperação). Isso existe por causa de
  dois problemas que o link de redefinição do Supabase tem quando é o **admin** quem
  dispara (não o próprio usuário):
  - PKCE guarda um cookie de verificação no navegador de quem *inicia* o pedido — como é
    o admin quem inicia, não quem clica, o link cai no fluxo implícito (`#hash` na URL)
    em vez de `?code=` trocável no servidor. `src/app/auth/set-session/page.tsx` existe
    pra ler esse hash e criar sessão client-side, e ainda é o `redirectTo` certo pro
    autoatendimento em `/recuperar-senha` (que continua usando `/auth/callback`, PKCE
    server-side, porque lá quem inicia e quem clica são a mesma pessoa/navegador).
  - Link de senha é de uso único — um e-mail disparado em massa esbarra no rate limit da
    API do SendGrid se disparado em paralelo (usar delay entre envios,
    `INTERVALO_ENTRE_ENVIOS_MS` em `actions.ts`), e além disso, com click tracking do
    SendGrid ligado, um scanner de segurança de e-mail que pré-visita o link antes do
    usuário real consome o token. Click tracking está desligado no SendGrid por causa
    disso; não reative sem avisar.
  - Cada tentativa de envio (sucesso ou erro) é gravada em `logs_envio_email`
    (migração 011) — visível em Usuários e turmas → Histórico de envios — porque antes
    disso não tinha como saber quem não recebeu.
  - Precisa de `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` / `SENDGRID_FROM_NOME` no
    `.env.local` e na Vercel — chave separada da configurada no SMTP do Supabase Auth
    (o Supabase não repassa a própria chave pro nosso código).
- **Confirmação de ações destrutivas**: não use `window.confirm()` — navegadores (Chrome
  principalmente) podem suprimir diálogos repetidos silenciosamente numa mesma página,
  fazendo a ação "não fazer nada" sem nenhum aviso. Use um estado de confirmação inline
  na própria UI (ver `TurmaItem.tsx` ou `ExcluirTrilhaButton.tsx` como referência).
- **Sem emojis em nenhuma parte do sistema** — pedido explícito do cliente, vale pra UI,
  e-mails, PDFs, tudo.
- **Certificado é por curso, não por trilha**: cada curso completado (aulas + quiz
  aprovado, se tiver) emite seu próprio certificado. O *modelo* (logo, título, texto)
  é global da empresa (`empresas.certificado_*`, editável em Configurações →
  Certificado); quem *assina* (nome, registro/RQE, cargo, imagem da assinatura) é por
  curso (`cursos.certificado_*`, editável na tela de editar curso).

## Contas de teste / verificação

Não peço nem digito a senha real do admin. Pra testar fluxos de admin em produção ou
local, uso a conta `aluno.teste@care.com` (senha `TesteAluno2026!`), promovendo o papel
dela pra `admin` via script com a service role key, testando, e **sempre revertendo pra
`aluno` e limpando qualquer dado fabricado** (turma de teste, progresso fake,
certificado gerado, etc.) antes de terminar.

## Convenções de UI/copy

- Toda a interface e os textos voltados ao usuário são em português.
- Design system em `src/design-system/{atoms,molecules,organisms}` — tokens de cor em
  `src/app/globals.css` via `@theme inline` (Tailwind v4), estilo MD3-like.
- Antes de mudar cor/tipografia, veja se já existe um token pronto em vez de hardcodar.
