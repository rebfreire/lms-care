-- Schema inicial — Plataforma de Cursos e Treinamentos (Care)
-- Baseado em plano-desenvolvimento.md. empresa_id em todas as tabelas
-- de conteúdo/progresso desde o início para manter multi-tenant viável.

create extension if not exists "pgcrypto";

create type papel_usuario as enum ('admin', 'aluno');
create type tipo_material as enum ('arquivo', 'link');

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  criado_em timestamptz not null default now()
);

-- usuarios espelha auth.users do Supabase Auth (id compartilhado).
create table usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  empresa_id uuid not null references empresas (id) on delete cascade,
  nome text not null,
  email text not null unique,
  papel papel_usuario not null default 'aluno',
  criado_em timestamptz not null default now()
);

create table turmas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas (id) on delete cascade,
  nome text not null
);

create table usuarios_turmas (
  usuario_id uuid not null references usuarios (id) on delete cascade,
  turma_id uuid not null references turmas (id) on delete cascade,
  primary key (usuario_id, turma_id)
);

create table trilhas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas (id) on delete cascade,
  nome text not null,
  descricao text
);

create table cursos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas (id) on delete cascade,
  nome text not null,
  descricao text,
  capa_url text
);

create table trilhas_cursos (
  trilha_id uuid not null references trilhas (id) on delete cascade,
  curso_id uuid not null references cursos (id) on delete cascade,
  ordem int not null,
  bloqueia_proximo boolean not null default true,
  primary key (trilha_id, curso_id)
);

create table modulos (
  id uuid primary key default gen_random_uuid(),
  curso_id uuid not null references cursos (id) on delete cascade,
  nome text not null,
  ordem int not null
);

create table aulas (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references modulos (id) on delete cascade,
  titulo text not null,
  ordem int not null,
  video_id_cloudflare text,
  texto_apoio text,
  liberacao_agendada_em timestamptz,
  turma_id uuid references turmas (id) on delete set null
);

create table aula_materiais (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references aulas (id) on delete cascade,
  tipo tipo_material not null,
  nome text not null,
  url text not null
);

create table progresso (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  aula_id uuid not null references aulas (id) on delete cascade,
  percentual_assistido numeric(5, 2) not null default 0,
  concluida boolean not null default false,
  concluida_em timestamptz,
  ultimo_acesso_em timestamptz not null default now(),
  unique (usuario_id, aula_id)
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references aulas (id) on delete cascade,
  nome text not null,
  nota_corte numeric(5, 2) not null default 70,
  tentativas_permitidas int not null default 3
);

create table questoes (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes (id) on delete cascade,
  enunciado text not null,
  ordem int not null
);

create table alternativas (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null references questoes (id) on delete cascade,
  texto text not null,
  correta boolean not null default false
);

create table tentativas_quiz (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  quiz_id uuid not null references quizzes (id) on delete cascade,
  nota numeric(5, 2) not null default 0,
  aprovado boolean not null default false,
  respondida_em timestamptz not null default now()
);

create table respostas (
  id uuid primary key default gen_random_uuid(),
  tentativa_id uuid not null references tentativas_quiz (id) on delete cascade,
  questao_id uuid not null references questoes (id) on delete cascade,
  alternativa_id uuid not null references alternativas (id) on delete cascade
);

create table certificados (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios (id) on delete cascade,
  trilha_id uuid not null references trilhas (id) on delete cascade,
  emitido_em timestamptz not null default now(),
  url_pdf text
);

-- Row Level Security: isolamento por empresa_id em cascata a partir de usuarios.

alter table empresas enable row level security;
alter table usuarios enable row level security;
alter table turmas enable row level security;
alter table usuarios_turmas enable row level security;
alter table trilhas enable row level security;
alter table cursos enable row level security;
alter table trilhas_cursos enable row level security;
alter table modulos enable row level security;
alter table aulas enable row level security;
alter table aula_materiais enable row level security;
alter table progresso enable row level security;
alter table quizzes enable row level security;
alter table questoes enable row level security;
alter table alternativas enable row level security;
alter table tentativas_quiz enable row level security;
alter table respostas enable row level security;
alter table certificados enable row level security;

create or replace function empresa_atual()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select empresa_id from usuarios where id = auth.uid();
$$;

create or replace function papel_atual()
returns papel_usuario
language sql
stable
security definer
set search_path = public
as $$
  select papel from usuarios where id = auth.uid();
$$;

-- usuarios: cada um vê apenas colegas da mesma empresa.
create policy usuarios_select on usuarios
  for select using (empresa_id = empresa_atual());
create policy usuarios_admin_all on usuarios
  for all using (empresa_id = empresa_atual() and papel_atual() = 'admin');

create policy empresas_select on empresas
  for select using (id = empresa_atual());

create policy turmas_isolamento on turmas
  for all using (empresa_id = empresa_atual());
create policy usuarios_turmas_isolamento on usuarios_turmas
  for all using (
    exists (select 1 from turmas t where t.id = turma_id and t.empresa_id = empresa_atual())
  );

create policy trilhas_isolamento on trilhas
  for all using (empresa_id = empresa_atual());
create policy cursos_isolamento on cursos
  for all using (empresa_id = empresa_atual());
create policy trilhas_cursos_isolamento on trilhas_cursos
  for all using (
    exists (select 1 from trilhas t where t.id = trilha_id and t.empresa_id = empresa_atual())
  );

create policy modulos_isolamento on modulos
  for all using (
    exists (select 1 from cursos c where c.id = curso_id and c.empresa_id = empresa_atual())
  );
create policy aulas_isolamento on aulas
  for all using (
    exists (
      select 1 from modulos m
      join cursos c on c.id = m.curso_id
      where m.id = modulo_id and c.empresa_id = empresa_atual()
    )
  );
create policy aula_materiais_isolamento on aula_materiais
  for all using (
    exists (
      select 1 from aulas a
      join modulos m on m.id = a.modulo_id
      join cursos c on c.id = m.curso_id
      where a.id = aula_id and c.empresa_id = empresa_atual()
    )
  );

-- progresso: aluno só vê/edita o próprio; admin vê tudo da empresa.
create policy progresso_proprio on progresso
  for all using (
    usuario_id = auth.uid()
    or (papel_atual() = 'admin' and exists (
      select 1 from usuarios u where u.id = usuario_id and u.empresa_id = empresa_atual()
    ))
  );

create policy quizzes_isolamento on quizzes
  for all using (
    exists (
      select 1 from aulas a
      join modulos m on m.id = a.modulo_id
      join cursos c on c.id = m.curso_id
      where a.id = aula_id and c.empresa_id = empresa_atual()
    )
  );
create policy questoes_isolamento on questoes
  for all using (
    exists (
      select 1 from quizzes q
      join aulas a on a.id = q.aula_id
      join modulos m on m.id = a.modulo_id
      join cursos c on c.id = m.curso_id
      where q.id = quiz_id and c.empresa_id = empresa_atual()
    )
  );
create policy alternativas_isolamento on alternativas
  for all using (
    exists (
      select 1 from questoes qs
      join quizzes q on q.id = qs.quiz_id
      join aulas a on a.id = q.aula_id
      join modulos m on m.id = a.modulo_id
      join cursos c on c.id = m.curso_id
      where qs.id = questao_id and c.empresa_id = empresa_atual()
    )
  );

create policy tentativas_proprias on tentativas_quiz
  for all using (
    usuario_id = auth.uid()
    or (papel_atual() = 'admin' and exists (
      select 1 from usuarios u where u.id = usuario_id and u.empresa_id = empresa_atual()
    ))
  );
create policy respostas_proprias on respostas
  for all using (
    exists (
      select 1 from tentativas_quiz t
      where t.id = tentativa_id
        and (t.usuario_id = auth.uid() or papel_atual() = 'admin')
    )
  );

create policy certificados_proprios on certificados
  for all using (
    usuario_id = auth.uid()
    or (papel_atual() = 'admin' and exists (
      select 1 from usuarios u where u.id = usuario_id and u.empresa_id = empresa_atual()
    ))
  );
