---
name: auditoria-hotmart
description: Auditoria do que foi construído até agora contra o inventário original de Área de Produto/Área de Membros da Hotmart, listado em LLMS - Care.md.
sources: [cowork]
---

# Auditoria — Care vs. inventário Hotmart

Checagem item a item do que ficou definido em [`LLMS - Care.md`](./LLMS%20-%20Care.md) (seção
"Mapeamento direto da Hotmart") contra o código atual, pra ver o que falta antes de considerar
a área de conteúdo/membros "equivalente" à Hotmart.

---

## ✅ Cumprido integralmente

| Item Hotmart | Onde está no Care |
| --- | --- |
| Conteúdo → Principal (módulos/aulas) | [`src/app/admin/cursos/[id]/page.tsx`](./src/app/admin/cursos/%5Bid%5D/page.tsx) |
| Conteúdo → aula (vídeo, texto de apoio, materiais, link externo) | [`EditarAulaForm.tsx`](./src/app/admin/cursos/%5Bid%5D/aulas/%5BaulaId%5D/editar/EditarAulaForm.tsx), [`MateriaisSection.tsx`](./src/app/admin/cursos/%5Bid%5D/aulas/%5BaulaId%5D/editar/MateriaisSection.tsx) |
| Agendamento de liberação por turma | mesmo form + `getTrilhaDoAluno` em [`trilha.ts`](./src/lib/trilha.ts) |
| Quiz tipo "Exercício" (múltipla escolha, nota de corte, tentativas) | [`quiz/page.tsx`](./src/app/admin/cursos/%5Bid%5D/aulas/%5BaulaId%5D/quiz/page.tsx), `EditarQuizConfigForm.tsx`, `NovaQuestaoForm.tsx` |
| Trilhas sequenciais com bloqueio opcional | [`admin/trilhas`](./src/app/admin/trilhas), `trilhas_cursos.bloqueia_proximo` |
| Turmas | `criarTurma`, `usuarios_turmas` |
| Usuários: lista com progresso/engajamento/último acesso + import CSV | [`admin/usuarios/page.tsx`](./src/app/admin/usuarios/page.tsx), `admin/usuarios/importar` |
| Cadastro/edição manual de usuário, reset de senha | `admin/usuarios/novo`, `admin/usuarios/[usuarioId]/editar` |
| Certificado automático ao concluir | [`certificado.ts`](./src/lib/certificado.ts) |
| Personalização (nome, logo, cor) | `admin/configuracoes` |
| Player com retomada + tracking automático (90%) | `AulaPlayer.tsx` |
| Trilha do aluno: progresso geral, "Continuar assistindo", bloqueio visual | `src/app/aluno/page.tsx` |
| Tela de aula: player + descrição + materiais + lista lateral com check/lock | `src/app/aluno/aulas/[id]/page.tsx` |

## ❌ Lacunas reais (itens que a Hotmart tinha e o Care deveria ter, mas ainda não tem)

1. **Certificado: sem liga/desliga por curso e sem editor de template**
   Hoje o certificado é tudo-ou-nada por trilha, com template fixo (nome, curso, data — hardcoded
   em [`certificado.ts`](./src/lib/certificado.ts)). Na Hotmart dá pra ligar/desligar certificado
   por curso individual e customizar campos do template. Isso era item "✅ Manter — exatamente
   como está na Hotmart" no levantamento original.

2. **Notificações por e-mail — não existe nenhuma além de recuperação de senha**
   O item 7 do levantamento original (e-mail de boas-vindas, lembrete de curso pendente,
   confirmação de conclusão) nunca foi implementado. Hoje quando o admin cria um usuário (manual
   ou CSV), a senha temporária só aparece na tela do admin — o aluno não recebe nada por e-mail.
   Isso é uma lacuna operacional real: o admin precisa repassar a senha manualmente pra cada um
   dos 65 alunos.

3. **Relatório agregado é por aluno, não por curso**
   O item "Insights → Cursos" da Hotmart é um dashboard por curso (inscritos, que acessaram, que
   iniciaram, ciclo de vida). O `admin/relatorios` atual ([`relatorios.ts`](./src/lib/relatorios.ts))
   agrega por aluno/trilha inteira, sem quebra por curso individual — não dá pra responder "quantos
   já começaram o curso de BIS especificamente".

4. **Ficha do aluno sem histórico de acessos (sessão/data)**
   A Hotmart mostra "sessão iniciada, página X acessada, em que data". A ficha atual
   ([`relatorios/[usuarioId]/page.tsx`](./src/app/admin/relatorios/%5BusuarioId%5D/page.tsx)) só
   mostra, por aula, "concluída em X" ou "visto em X" (uma data só, a mais recente) — não um
   histórico cronológico de acessos.

5. **Não existe "página do curso" antes da aula**
   Na Hotmart o aluno entra no curso primeiro (banner, descrição, progresso daquele curso
   especificamente, botão Continuar) e só depois entra numa aula. No Care, `/aluno` já lista tudo
   (todos os cursos com todas as aulas expandidas) e o aluno vai direto pra aula — não tem uma
   parada intermediária por curso. Funciona, mas é uma estrutura de navegação diferente da
   referência.

6. **Sem busca na lista lateral de conteúdo**
   Detalhe pequeno da tela de aula: a Hotmart tem uma busca no topo da lista lateral de aulas.
   Com 9 cursos seria baixo impacto, mas cresce se o catálogo aumentar.

## 🟡 Cortado por decisão, não por esquecimento (confirmar que continua correto)

Estes seguem exatamente a decisão registrada no levantamento original — nenhuma ação necessária,
só confirmando que não viraram lacuna sem querer:

- Comentários em aula (moderação)
- Aula ao vivo
- Gamificação (pontos/badges/ranking)
- Domínio próprio
- Validação pública de certificado (link de verificação externo)
- Tudo do nível "Produto" (venda, afiliados, cupom, impostos, checkout) — corretamente ausente
- Tutor de IA
- Comunidades/fórum

## Recomendação de prioridade

Das 6 lacunas reais, as duas primeiras têm impacto operacional imediato pros 65 alunos que já
estão usando o sistema:

1. **E-mail de boas-vindas com a senha temporária** — sem isso o admin ainda depende de um passo
   manual (WhatsApp/planilha) pra cada novo usuário, que é exatamente o tipo de atrito que o
   sistema deveria eliminar.
2. **Liga/desliga certificado por curso** — hoje simples de fazer (uma coluna `certificado_ativo`
   em `cursos` + checar no `certificado.ts`), sem precisar do editor de template ainda.

As outras quatro (relatório por curso, histórico de acesso, página do curso, busca) são
melhorias de profundidade — valem a pena, mas nenhuma bloqueia o uso diário hoje.
