-- Item 2 da auditoria Hotmart: liga/desliga certificado por curso.
alter table cursos add column certificado_ativo boolean not null default true;

-- Item 4 da auditoria Hotmart: histórico de acessos (sessão iniciada, quando).
create table eventos_acesso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  ocorrido_em timestamptz not null default now()
);

alter table eventos_acesso enable row level security;

create policy eventos_acesso_proprio on eventos_acesso
  for all using (
    usuario_id = auth.uid()
    or (papel_atual() = 'admin' and exists (
      select 1 from usuarios u where u.id = usuario_id and u.empresa_id = empresa_atual()
    ))
  );

create index eventos_acesso_usuario_idx on eventos_acesso (usuario_id, ocorrido_em desc);
