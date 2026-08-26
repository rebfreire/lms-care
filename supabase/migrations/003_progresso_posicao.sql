-- Necessário pra "retomar de onde parou" com precisão — percentual sozinho
-- não basta pra fazer seek no player.
alter table progresso add column posicao_segundos numeric(10, 2) not null default 0;
