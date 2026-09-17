-- Registra quando o usuário troca a senha provisória pela própria (via
-- /redefinir-senha), pra cruzar com logs_envio_email e eventos_acesso na
-- tela de status de acesso: quem recebeu o e-mail, quem já logou, quem já
-- trocou a senha.
alter table usuarios add column senha_alterada_em timestamptz;
