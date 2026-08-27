---
name: historico-desenvolvimento
description: Registro cronológico de tudo que foi construído, decidido e corrigido no desenvolvimento da plataforma Care, da Fase 0 até o estado atual em produção.
sources: [cowork]
---

# Histórico de desenvolvimento — Plataforma Care

Substituto interno da Hotmart para treinamentos corporativos do Grupo Care Anestesia
(~70 usuários, sem venda). Contexto original em [`LLMS - Care.md`](./LLMS%20-%20Care.md)
e plano faseado em [`plano-desenvolvimento.md`](./plano-desenvolvimento.md). Este documento
registra o que foi de fato construído, na ordem em que aconteceu.

**Produção**: https://lms-care.vercel.app (deploy automático a cada push em `main`)
**Repositório**: https://github.com/rebfreire/lms-care

---

## Fase 0 — Setup do projeto

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Design system inicial **"Care Terra"**: paleta terrosa (verde/creme) inspirada no
  design system do projeto GSC, com arquitetura de componentes (atoms/molecules/organisms)
  e raio de cartão generoso emprestados do Sistema Agência
- Schema completo no Supabase (Postgres + Auth + Storage) com Row Level Security por
  `empresa_id` desde o início: `empresas → usuarios → turmas → trilhas → cursos → módulos
  → aulas → progresso → quizzes → questões → alternativas → tentativas → certificados`
- Repositório Git criado e conectado ao GitHub (`rebfreire/lms-care`)

## Fase 1 — Autenticação

- Login único por e-mail/senha, com redirecionamento por papel (`admin` → `/admin`,
  `aluno` → `/aluno`) — não são duas URLs separadas
- Guarda de rota no servidor (admin não acessa área restrita de admin sem papel correto)
- Logout
- **Bug corrigido**: `reset.sql` (usado para recomeçar o schema durante os testes) apagava
  os grants padrão do Supabase pra `anon`/`authenticated`, causando "permission denied"
  em todas as queries autenticadas — corrigido reaplicando os grants

## Fase 2 — Cursos, módulos, aulas e vídeo

- CRUD de curso → módulo → aula
- Upload de vídeo direto do navegador pro **Cloudflare Stream** (direct creator upload),
  sem passar pelo servidor da aplicação
- Arquivos grandes (>190MB) usam upload resumível via protocolo TUS (necessário pra um
  vídeo real de 1,5GB do cliente)

## Fase 3 — Trilhas

- Trilha = sequência ordenada de cursos, com opção de bloquear o próximo curso até o
  anterior ser concluído (`bloqueia_proximo`)
- Reordenação por setas, remoção de curso da trilha

## Fase 4 — Usuários, turmas e importação

- Importação de usuários em massa via CSV — ajustado pra aceitar o formato real de
  exportação da Hotmart (`;` como separador, colunas `name`/`class`, encoding ISO-8859-1)
- **65 alunos reais importados** (62 com sucesso, 3 com e-mail ausente/inválido no CSV
  original do cliente — ficou registrado em `content/alunos/resultado-importacao.csv`,
  fora do git)
- Turma "Equipe Médica" criada com todos os alunos
- Tabela `atribuicoes_trilha` adicionada (não estava no schema original) pra permitir
  atribuir trilha por usuário individual ou por turma inteira
- **9 cursos reais do cliente** importados via script (`scripts/importar-conteudo.mjs`),
  lendo da pasta original do Google Drive do cliente (nunca duplicada dentro do repo):
  Via Aérea Difícil, BIS, TOF, Assepsia e Higiene das Mãos, Bomba de Infusão, Cuidados
  com Cateter, Isolamento e Precaução, Cardioversor, Intoxicação por Anestésico Local
- Trilha "Treinamentos Obrigatórios" montada com os 9 cursos, sem bloqueio entre eles
  (são módulos independentes)
- Adicionado depois desta fase: **criar e editar usuário manualmente** (um de cada vez,
  além do CSV em lote), com reset de senha e remoção

## Fase 5 — Área do aluno: trilha e player

- Tela de trilha com status por curso (concluído / em andamento / bloqueado)
- Player embutido do Cloudflare Stream via SDK, com tracking automático de progresso e
  retomada de onde parou (posição em segundos salva)
- Conclusão automática da aula ao atingir 90% assistido
- Bloqueio de curso reforçado também no servidor, não só na UI

## Fase 6 — Quiz

- Banco de questões de múltipla escolha por aula, nota de corte e tentativas permitidas
- Aluno responde, vê nota e feedback de acerto/erro por questão
- Melhorias posteriores: configurações do quiz editáveis depois de criado (antes só na
  criação), alternativas ilimitadas (antes travava em 4)

## Fase 7 — Relatórios

- Dashboard agregado (total de alunos, ativos/inativos em 14 dias, quantos concluíram
  a trilha), lista de alunos com progresso e engajamento, ficha individual (progresso
  por aula + histórico de quiz), exportação CSV

## Fase 8 — Certificados

- Geração automática de PDF (via `pdf-lib`) quando o aluno conclui todos os cursos da
  trilha **e** é aprovado em todo quiz vinculado
- **Correção de regra**: curso sem nenhuma aula cadastrada (conteúdo pendente de upload)
  não pode travar a trilha pra sempre — passou a contar como "nada a fazer"
- PDF sobe pro Supabase Storage (bucket `certificados`), aluno baixa em `/aluno/certificados`

## Fase 9 — Personalização, deploy e polimento

### Deploy em produção
- Projeto conectado ao GitHub na Vercel, deploy automático a cada push
- Env vars de produção configuradas (Supabase + Cloudflare)

### Personalização
- Admin edita nome do sistema, logo e cor primária em `/admin/configuracoes`
- **Bug corrigido**: a tabela `empresas` só tinha policy de `SELECT` no RLS — o logo
  chegava a subir no Storage, mas a atualização de nome/cor/logo na tabela era
  silenciosamente ignorada (RLS bloqueava o `UPDATE` sem erro visível). Corrigido usando
  o client admin pra essa escrita específica

### Fechando a distância em relação à Hotmart
Depois de navegar a área de membros real da Hotmart junto com o cliente pra comparar,
foram identificadas e corrigidas várias lacunas de edição que só existiam no fluxo de
criação:
- Editar curso (nome/descrição) e editar aula (título/texto de apoio) — antes só dava
  pra criar
- **Editor de texto rico** (Tiptap) no texto de apoio da aula, em vez de texto puro
- **Materiais anexos por aula** — upload de arquivo ou link externo, aluno vê com botão
  Download/Abrir (schema já existia desde a Fase 0, faltava a UI)
- **Agendamento de liberação de aula** por data e opcionalmente por turma específica
  (schema já existia, faltava UI e a lógica de bloqueio)
- Botão "Cancelar" adicionado nos formulários de edição que só tinham "Salvar"

### Nova paleta "Care Azul"
- Paleta derivada de `#019cd9` (cor definida pelo cliente): primária azul, acento âmbar
  quente de apoio (`#b6752a`, pra não deixar o produto frio demais), neutros frios
  (branco-azulado) no lugar do creme quente da Terra
- Sem emojis em nenhuma parte do sistema

### Login e recuperação de senha
- Tela de login redesenhada em duas colunas (referência: Hotmart) — logo + nome da
  empresa + formulário à esquerda, foto de marca do cliente à direita com gradiente
- Logo/nome/cor da empresa aparecem mesmo sem sessão (login, recuperação de senha)
- Fluxo completo de recuperação de senha: pedir e-mail → link do Supabase Auth →
  `/auth/callback` troca o código pela sessão (PKCE) → definir senha nova
- Envio de e-mail usando o serviço padrão do Supabase por enquanto (funciona, mas é
  limitado em volume e não tem remetente com a marca do cliente) — SMTP próprio
  (Resend/SendGrid) fica como melhoria futura, não é bloqueante agora

---

## Estado atual (o que funciona de ponta a ponta, testado)

- Login/logout, recuperação de senha
- CRUD completo de curso/módulo/aula, com edição, upload de vídeo, materiais e texto rico
- Trilhas com sequenciamento e bloqueio opcional
- Importação de usuários em massa (CSV) e cadastro/edição manual
- Player do aluno com progresso, retomada e bloqueio por agendamento
- Quiz com banco de questões e configuração editável
- Relatórios (dashboard, lista, ficha, CSV)
- Certificado em PDF automático
- Personalização (nome, logo, cor) refletida em toda a interface, inclusive pré-login
- Deploy automático em produção

## Pendências conhecidas (dependem de dado ou decisão do cliente, não de código)

1. **3 cursos sem vídeo** — Via Aérea Difícil, BIS e TOF só têm capa e um `.gdoc` na
   pasta original do cliente, sem `.mp4`. Não travam mais a trilha, mas ficam vazios
   pro aluno até o conteúdo ser gravado/enviado
2. **3 alunos não importados** — e-mail ausente ou inválido (`-`) no CSV original;
   precisa do contato correto pra cadastrar manualmente
3. **SMTP próprio** — opcional, pra e-mails com a marca da empresa em vez do remetente
   genérico do Supabase
4. **Migração `005_empresas_update_admin.sql`** — corrige a regra de segurança na
   origem (o código já contorna o problema, então essa migração é só uma limpeza,
   não é urgente)
