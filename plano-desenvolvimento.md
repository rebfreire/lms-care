---
name: plano-desenvolvimento
description: Plano de desenvolvimento faseado e brief técnico para construir a plataforma de cursos/treinamentos (substituta da Hotmart), pronto para repassar a um dev ou colar no Claude Code
sources: [cowork]
---

# Plano de desenvolvimento — Plataforma de Cursos e Treinamentos

Este plano consolida tudo o que foi levantado em `requisitos-plataforma-cursos.md` num roteiro de execução, faseado, para você repassar a quem for codar (você mesmo com IA, um dev contratado, ou uma sessão do Claude Code). No fim tem um brief pronto para colar como primeira mensagem de uma sessão de desenvolvimento.

## Recapitulando o essencial

- **Cliente inicial**: ~70 usuários, cadastro manual pelo admin, sem autoatendimento
- **Formato**: clone enxuto da Hotmart — Área Admin (cursos, trilhas, usuários, relatórios) + Área do Aluno (trilha sequencial, player, quiz, certificado)
- **Arquitetura**: caminho híbrido — Cloudflare Stream (ou Bunny Stream) para hospedagem de vídeo + tracking de progresso, camada própria por cima para trilha/quiz/relatórios/certificados
- **Stack**: Next.js (frontend) + Supabase (Postgres + Auth + Storage, com Row Level Security por "empresa" desde já) + Cloudflare Stream (vídeo) + Vercel (hospedagem)

## Modelo de dados detalhado

```
empresas
  id, nome, criado_em

usuarios
  id, empresa_id, nome, email, senha_hash, papel (admin | aluno), criado_em

turmas
  id, empresa_id, nome (ex.: "Equipe Contábil")

usuarios_turmas
  usuario_id, turma_id

trilhas
  id, empresa_id, nome, descricao

trilhas_cursos
  trilha_id, curso_id, ordem, bloqueia_proximo (bool)

cursos
  id, empresa_id, nome, descricao, capa_url

modulos
  id, curso_id, nome, ordem

aulas
  id, modulo_id, titulo, ordem, video_id_cloudflare, texto_apoio,
  liberacao_agendada_em, turma_id (nullable, se liberação for por turma)

aula_materiais
  id, aula_id, tipo (arquivo | link), nome, url

progresso
  id, usuario_id, aula_id, percentual_assistido, concluida (bool),
  concluida_em, ultimo_acesso_em

quizzes
  id, aula_id, nome, nota_corte, tentativas_permitidas

questoes
  id, quiz_id, enunciado, ordem

alternativas
  id, questao_id, texto, correta (bool)

tentativas_quiz
  id, usuario_id, quiz_id, nota, aprovado (bool), respondida_em

respostas
  id, tentativa_id, questao_id, alternativa_id

certificados
  id, usuario_id, trilha_id, emitido_em, url_pdf
```

`empresa_id` presente desde o início em tudo (via Row Level Security no Supabase) é o que mantém a porta aberta para multi-tenant, mesmo lançando com uma empresa só.

## Fases de desenvolvimento

### Fase 0 — Setup do projeto
- Criar repositório, projeto Next.js, projeto Supabase, conta Cloudflare Stream
- Configurar variáveis de ambiente e deploy inicial vazio na Vercel
- Entregável: "hello world" publicado, banco vazio criado com as tabelas acima

### Fase 1 — Autenticação e base
- Login por e-mail/senha (Supabase Auth)
- Papéis admin/aluno com controle de rota (admin não acessa telas de aluno e vice-versa, exceto preview)
- Row Level Security por `empresa_id` em todas as tabelas
- Entregável: login funcional, redirecionamento por papel

### Fase 2 — Admin: Cursos, Módulos e Aulas
- CRUD de curso → módulo → aula
- Upload de vídeo por aula via Cloudflare Stream (direct creator upload — ver seção técnica do doc de requisitos)
- Upload de materiais anexos (arquivo) e link de leitura complementar
- Entregável: admin consegue montar um curso completo com vídeo e materiais

### Fase 3 — Admin: Trilhas
- Criar trilha, adicionar cursos em ordem, opção de travar próximo curso até concluir o anterior
- Agendamento de liberação (opcional, por turma)
- Entregável: uma trilha de teste com 2-3 cursos sequenciados

### Fase 4 — Admin: Usuários e Turmas
- Importação de usuários em massa via CSV (nome, e-mail, turma)
- Criação/gestão de turmas
- Atribuição de trilha(s) por usuário ou turma
- Entregável: os 70 usuários do cliente importados e atribuídos à trilha certa

### Fase 5 — Área do Aluno: trilha e player
- Tela de trilha (lista de cursos/aulas com status: concluído / em andamento / bloqueado)
- Player de vídeo embutido (Cloudflare Stream), com retomada de onde parou
- Tracking automático de progresso (% assistido, timestamp) via eventos do player
- Regra de conclusão da aula (decidir: automática ao atingir X% ou confirmação manual — ver observação de UX no doc de requisitos)
- Entregável: aluno consegue assistir a trilha inteira em sequência, com progresso salvo

### Fase 6 — Quiz
- Admin: banco de questões de múltipla escolha por aula, nota de corte, tentativas permitidas
- Aluno: responder quiz ao final da aula, ver nota e feedback de acerto/erro
- Entregável: quiz funcional ligado a uma aula, nota registrada por tentativa

### Fase 7 — Relatórios
- Lista de usuários com progresso %, engajamento, último acesso (visão admin)
- Ficha individual do aluno: aulas concluídas/pendentes, resultado de quiz, histórico de acesso
- Dashboard agregado: inscritos, ativos, inativos, % de conclusão da trilha
- Exportação CSV
- Entregável: RH consegue ver de relance quem está atrasado

### Fase 8 — Certificados
- Template de certificado com campos automáticos (nome, curso/trilha, data, organizador)
- Geração automática de PDF ao atingir nota mínima + trilha concluída
- Entregável: aluno baixa certificado ao concluir

### Fase 9 — Personalização, QA e lançamento
- Nome do sistema, logo, cor da empresa
- Testes com os 70 usuários reais (ou uma amostra), ajuste de bugs
- Deploy final, treinamento rápido do admin (você) no uso do painel
- Entregável: sistema no ar para o cliente

## Fora do escopo do MVP (cortado deliberadamente)

Vendas/checkout, afiliados, coproduções, cupons, coleta de impostos, comunidades/fórum e moderação, tutor de IA, gamificação (pontos/badges), SSO corporativo, comentários por aula, transmissão ao vivo. Todos esses itens estão documentados no mapeamento da Hotmart em `requisitos-plataforma-cursos.md` — podem entrar depois, mas não bloqueiam o lançamento.

## Ordem sugerida se for você + IA (Claude Code) construindo

Fases 0→1→2→5 (sem quiz/certificado ainda) formam o menor caminho até ter algo demonstrável: um curso no ar, com trilha e player funcionando para um usuário de teste. Só depois entram Fase 4 (usuários em massa), Fase 6 (quiz) e Fase 8 (certificado) — nessa ordem porque cada uma depende da anterior estar estável.

---

## Brief para colar como primeira mensagem numa sessão de desenvolvimento (Claude Code ou outro dev)

```
Preciso construir uma plataforma de cursos/treinamentos corporativos internos, substituindo a Hotmart
(que limita a 10 usuários gratuitos por curso). É para uso interno de uma empresa, ~70 usuários,
sem venda — só treinamento.

STACK: Next.js + Supabase (Postgres + Auth + Storage, com Row Level Security por empresa_id desde
o início) + Cloudflare Stream para hospedagem/streaming de vídeo (upload direto do navegador via
direct creator upload API, sem passar pelo meu servidor) + deploy na Vercel.

FORMATO: duas áreas — Admin (produtor) e Aluno (membro), espelhando a estrutura da Hotmart Club,
mas sem nada relacionado a venda.

MODELO DE DADOS (resumo): empresas → usuarios (admin|aluno) → turmas → trilhas → trilhas_cursos
(ordem, bloqueia_proximo) → cursos → modulos → aulas (video_id_cloudflare, texto_apoio, materiais)
→ progresso (por usuario+aula: percentual_assistido, concluida, ultimo_acesso) → quizzes → questoes
→ alternativas → tentativas_quiz → respostas → certificados.

ESCOPO DO ADMIN:
- CRUD de curso → módulo → aula, com upload de vídeo (Cloudflare Stream) e anexos
- Trilhas: sequenciar cursos, opção de travar o próximo até concluir o anterior
- Quiz: banco de questões de múltipla escolha, nota de corte, tentativas permitidas
- Usuários: importação em massa via CSV, agrupamento em turmas, atribuição de trilha
- Relatórios: lista de alunos com progresso/engajamento/último acesso; ficha individual com
  aulas concluídas, resultado de quiz e histórico; dashboard agregado de inscritos/ativos/inativos;
  exportação CSV
- Certificados: template com campos automáticos, geração automática de PDF ao concluir com nota mínima
- Personalização básica: nome do sistema, logo, cor

ESCOPO DO ALUNO:
- Login simples (e-mail/senha, conta criada pelo admin)
- Tela de trilha: lista de cursos/aulas com status concluído/em andamento/bloqueado, progresso %
- Player de vídeo com retomada de onde parou e tracking automático de progresso
- Quiz ao final da aula com feedback
- Certificado disponível para download ao concluir

FORA DE ESCOPO (não implementar): checkout/venda, afiliados, cupons, impostos, comunidade/fórum,
tutor de IA, gamificação, SSO, comentários, transmissão ao vivo.

Quero começar pela Fase 0 (setup do projeto: Next.js + Supabase + Cloudflare Stream configurados,
schema do banco criado) e Fase 1 (autenticação com papéis admin/aluno). Pode propor a estrutura de
pastas do projeto e o schema SQL das tabelas antes de começar a codar.
```
