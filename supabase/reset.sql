-- Reset do schema public — só usar em projeto novo, sem dados reais ainda.
drop schema public cascade;
create schema public;
grant all on schema public to postgres;
grant all on schema public to public;

-- Recriar o schema apaga os grants padrão do Supabase para anon/authenticated —
-- sem isso toda query autenticada falha com "permission denied" antes mesmo de
-- avaliar RLS. Ver fix-grants.sql para reaplicar caso esqueça de rodar aqui.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
