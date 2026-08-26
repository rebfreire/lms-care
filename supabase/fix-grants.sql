-- Restaura os privilégios padrão do Supabase no schema public, perdidos ao
-- recriar o schema em reset.sql. Sem isso, o Postgres bloqueia o acesso antes
-- mesmo de avaliar as políticas de RLS ("permission denied for table ...").

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
