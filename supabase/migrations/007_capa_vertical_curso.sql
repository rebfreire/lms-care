-- capa_url (já existia) passa a guardar a capa horizontal (banner);
-- esta coluna nova guarda a capa vertical (pôster, usada nos cards da trilha).
alter table cursos add column capa_vertical_url text;
