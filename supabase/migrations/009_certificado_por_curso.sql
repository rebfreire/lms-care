-- Redesenho do certificado: modelo (título/texto/logo) é global da empresa,
-- mas quem assina pode variar por curso — e o certificado passa a ser
-- emitido por curso concluído, não pela trilha inteira.

alter table cursos add column certificado_assinante_nome text;
alter table cursos add column certificado_assinante_cargo text;
alter table cursos add column certificado_assinatura_url text;

alter table trilhas drop column certificado_assinante_nome;
alter table trilhas drop column certificado_assinante_cargo;
alter table trilhas drop column certificado_assinatura_url;

alter table empresas add column certificado_ativo boolean not null default true;
alter table empresas add column certificado_titulo text;
alter table empresas add column certificado_texto text;

alter table certificados add column curso_id uuid references cursos (id) on delete cascade;
alter table certificados alter column trilha_id drop not null;

create unique index certificados_usuario_curso_idx on certificados (usuario_id, curso_id)
  where curso_id is not null;
