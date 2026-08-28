-- Assinatura/validação do certificado, configurável por trilha.
alter table trilhas add column certificado_assinante_nome text;
alter table trilhas add column certificado_assinante_cargo text;
alter table trilhas add column certificado_assinatura_url text;
