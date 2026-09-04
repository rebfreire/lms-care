-- Campo pra registro profissional de quem assina (ex.: RQE, CRM) — aparece
-- entre o nome e o cargo no bloco de assinatura do certificado.
alter table cursos add column certificado_assinante_registro text;
