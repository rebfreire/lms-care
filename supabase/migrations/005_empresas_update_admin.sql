-- empresas só tinha policy de SELECT (schema.sql original) — admin nunca
-- conseguia dar update na própria empresa via RLS normal (a query simplesmente
-- não afetava nenhuma linha, sem erro). Adiciona UPDATE restrito a admin.
create policy empresas_update_admin on empresas
  for update using (id = empresa_atual() and papel_atual() = 'admin');
