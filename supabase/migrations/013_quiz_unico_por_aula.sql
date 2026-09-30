-- Um quiz por aula.
--
-- Antes desta migração nada impedia vários quizzes na mesma aula: a tela de
-- quiz usa maybeSingle(), que falha com 2+ linhas, então depois do primeiro
-- "Criar quiz" a tela voltava a mostrar o formulário de criação e cada novo
-- clique criava mais um duplicado.

-- 1. Remove duplicados vazios (sem questões e sem tentativas), mantendo um por
--    aula: prioriza o que tem questões, depois o que tem tentativas.
with ranqueados as (
  select
    q.id,
    row_number() over (
      partition by q.aula_id
      order by
        exists (select 1 from questoes x where x.quiz_id = q.id) desc,
        exists (select 1 from tentativas_quiz t where t.quiz_id = q.id) desc,
        q.id
    ) as pos,
    not exists (select 1 from questoes x where x.quiz_id = q.id)
      and not exists (select 1 from tentativas_quiz t where t.quiz_id = q.id) as vazio
  from quizzes q
)
delete from quizzes
where id in (select id from ranqueados where pos > 1 and vazio);

-- 2. Garante no banco. Falha se sobrar duplicado com conteúdo (revisar à mão).
alter table quizzes
  add constraint quizzes_aula_id_unique unique (aula_id);
