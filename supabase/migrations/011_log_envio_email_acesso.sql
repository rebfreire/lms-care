-- Log persistido de envio de e-mail de acesso (criar usuário / envio em massa
-- em Usuários e turmas). Sem isso não dá pra saber depois quem recebeu e quem
-- falhou (ex.: falha por rate limit do SendGrid), já que o resultado só
-- aparecia na tela na hora do envio e se perdia ao recarregar a página.
create table logs_envio_email (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas (id) on delete cascade,
  usuario_id uuid references usuarios (id) on delete set null,
  nome text not null,
  email text not null,
  ok boolean not null,
  erro text,
  enviado_por uuid references usuarios (id) on delete set null,
  criado_em timestamptz not null default now()
);

alter table logs_envio_email enable row level security;

create policy logs_envio_email_admin on logs_envio_email
  for all using (
    papel_atual() = 'admin' and empresa_id = empresa_atual()
  );

create index logs_envio_email_empresa_idx on logs_envio_email (empresa_id, criado_em desc);
