-- Faltava no schema inicial: como associar uma trilha a um usuário ou turma.
-- Uma linha aponta pra usuario_id OU turma_id (nunca os dois), permitindo
-- atribuição individual ou em lote por turma.

create table atribuicoes_trilha (
  id uuid primary key default gen_random_uuid(),
  trilha_id uuid not null references trilhas (id) on delete cascade,
  usuario_id uuid references usuarios (id) on delete cascade,
  turma_id uuid references turmas (id) on delete cascade,
  criado_em timestamptz not null default now(),
  constraint atribuicao_um_alvo check (
    (usuario_id is not null and turma_id is null)
    or (usuario_id is null and turma_id is not null)
  )
);

create unique index atribuicoes_trilha_usuario_unica
  on atribuicoes_trilha (trilha_id, usuario_id)
  where usuario_id is not null;

create unique index atribuicoes_trilha_turma_unica
  on atribuicoes_trilha (trilha_id, turma_id)
  where turma_id is not null;

alter table atribuicoes_trilha enable row level security;

create policy atribuicoes_trilha_isolamento on atribuicoes_trilha
  for all using (
    exists (select 1 from trilhas t where t.id = trilha_id and t.empresa_id = empresa_atual())
  );
