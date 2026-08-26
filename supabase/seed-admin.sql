-- Cria a empresa (tenant) e vincula o usuário admin já criado em Authentication > Users.

with nova_empresa as (
  insert into empresas (nome) values ('Grupo Care Anestesia')
  returning id
)
insert into usuarios (id, empresa_id, nome, email, papel)
select
  au.id,
  nova_empresa.id,
  'Ricardo Freire',
  au.email,
  'admin'
from auth.users au, nova_empresa
where au.email = 'rieller@gmail.com';
