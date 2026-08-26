---

## **name: requisitos-plataforma-cursos description: Levantamento de requisitos e arquitetura para substituir a Hotmart por um LMS próprio para treinamentos corporativos internos sources: \[cowork\]**

# **Substituindo a Hotmart — plataforma própria de cursos/treinamentos**

## **Contexto**

A Hotmart foi escolhida originalmente por causa das métricas de engajamento (quem começou, até que minuto assistiu, se fez o quiz, quantos acertos). Mas ela é uma plataforma de venda de infoprodutos, não de treinamento corporativo — daí o limite de 10 usuários gratuitos por curso, que inviabiliza uso interno em escala. O objetivo agora é reconstruir só o que importa (tracking de progresso \+ avaliação \+ relatórios), sem o excesso de recursos voltados a vendas.

## **Módulos funcionais necessários**

### **1\. Usuários e acesso**

* \~70 usuários neste cliente, cadastrados manualmente pelo admin (sem autoatendimento/self-signup, sem fluxo de "compra")  
* Papéis: admin (você/RH/T\&D) e aluno — não há necessidade de um papel "instrutor" separado por enquanto, já que o cadastro de conteúdo também é feito pelo admin  
* Admin cria a conta (nome \+ e-mail, senha temporária ou link de convite) e atribui a trilha(s)/curso(s) a cada usuário  
* SSO fica como possível melhoria futura, não é bloqueante no lançamento — com 70 usuários manuais, autenticação simples (e-mail \+ senha) resolve

### **2\. Gestão de conteúdo**

* Hierarquia curso → módulo → aula  
* Upload e hospedagem de vídeo  
* Materiais de apoio anexos (PDF, slides)  
* Sequenciamento e pré-requisitos entre aulas (bloquear aula 2 até concluir aula 1, por exemplo)

### **3\. Player de vídeo com tracking granular (o núcleo do sistema)**

* % assistido e até que segundo o aluno chegou  
* Retomar de onde parou  
* Eventos: iniciou, atingiu X%, concluiu  
* É a parte tecnicamente mais delicada — depende de como o vídeo é hospedado (ver seção técnica)

### **4\. Avaliações (quiz)**

* Banco de questões (múltipla escolha, V/F, dissertativa)  
* Nota de corte para aprovação e número de tentativas permitidas  
* Registro de respostas certas/erradas por aluno e por questão

### **5\. Analytics e relatórios (o motivo de ter escolhido Hotmart)**

* Visão por aluno: progresso, tempo assistido, nota, tentativas  
* Visão agregada: % de conclusão por equipe/empresa, quem não iniciou, quem está atrasado  
* Exportação para CSV/Excel para uso do RH

### **6\. Certificados**

* Geração automática de PDF ao concluir com nota mínima  
* Validação/verificação do certificado (opcional)

### **7\. Notificações**

* E-mail de boas-vindas, lembrete de curso pendente, confirmação de conclusão

### **8\. Administração**

* Se a plataforma for virar produto para vários clientes, precisa de multi-tenant (cada empresa isolada, com seus próprios usuários/cursos/relatórios) — decisão que muda bastante a arquitetura, ver seção de decisões abaixo

## **Decisões técnicas que definem o esforço**

**Hospedagem de vídeo** — é o ponto que mais influencia custo e prazo:

* Self-host (S3/Cloudflare R2 \+ transcoding próprio): mais barato em escala, mas você constrói o tracking de progresso do zero  
* Serviço especializado (Mux, Cloudflare Stream, Bunny Stream, Vimeo API/Vimeo Enterprise): já entregam player com webhooks/eventos de progresso prontos — resolve boa parte do "coração" do sistema sem reinventar

**Autenticação**: solução própria vs Auth0/Clerk/Supabase Auth vs SSO corporativo direto

**Stack e hospedagem geral**: a definir conforme quem vai desenvolver/manter

## **Decisões já tomadas (26/08/2026)**

* **Escopo**: começar atendendo este cliente, mas com arquitetura pensada para escalar para outros clientes depois (não é single-tenant descartável)  
* **Volume**: \~70 usuários neste cliente, todos cadastrados manualmente pelo admin — sem autoatendimento  
* **Formato do produto**: praticamente um "clone" da Hotmart em estrutura — duas áreas: (1) Área Admin, onde você cadastra cursos, trilhas, usuários e acompanha relatórios; (2) Área do Aluno, com a trilha de cursos que precisa ser seguida em sequência  
* **Abordagem de construção**: com esse volume (70 usuários, sem necessidade de multi-tenant real agora), o caminho híbrido (C) continua o mais indicado — ver comparação abaixo

## **Estrutura do produto: Área Admin \+ Área do Aluno**

Mapeando 1:1 com o que você usava na Hotmart:

### **Área Admin (equivalente à "Área de Produtor" da Hotmart)**

* **Cursos**: criar/editar curso → módulos → aulas; upload de vídeo; anexar materiais (PDF, slides)  
* **Trilhas**: montar uma trilha como uma sequência ordenada de cursos (ex.: Trilha de Onboarding \= Curso 1 → Curso 2 → Curso 3), com a opção de travar o próximo curso até o anterior ser concluído  
* **Quiz builder**: criar banco de questões por aula/módulo, definir nota de corte e tentativas permitidas  
* **Usuários**: cadastro manual, atribuição de trilha(s)/curso(s) por pessoa  
* **Relatórios/analytics**: por aluno (progresso, tempo assistido, nota) e agregado (% de conclusão da trilha, quem não iniciou, quem está atrasado), com exportação para CSV/Excel  
* **Certificados**: configurar nota mínima e gerar automaticamente ao concluir

### **Área do Aluno (equivalente à "Área de Membros" da Hotmart)**

* Login (e-mail \+ senha, criado pelo admin)  
* Visualização da trilha atribuída, com indicação clara do que já foi concluído, o que está em andamento e o que ainda está bloqueado  
* Player de vídeo com retomada de onde parou e tracking automático de progresso  
* Quiz ao final do módulo/aula, com feedback de acerto/erro  
* Certificado disponível para download ao concluir a trilha

## **Mapeamento direto da Hotmart (26/08/2026) — o que manter e o que cortar**

Entrei na conta de produtor da Hotmart (com o Ricardo logado) e naveguei pela estrutura real de administração de um curso, tanto no nível "Produto" (onde ficam as configurações de venda) quanto no nível "Área de Membros/Club" (onde fica o conteúdo em si). Abaixo está o inventário completo, já marcado com o que faz sentido replicar e o que é específico de venda de infoproduto e deve ser cortado.

### **Nível "Produto" (configurações do produto na Hotmart) — quase tudo é sobre venda, então quase tudo corta**

| Item na Hotmart | O que é | Manter no seu sistema? |
| ----- | ----- | ----- |
| Links de divulgação | Links de afiliado/checkout para vender | ❌ Cortar |
| Informações básicas | Nome, categoria, descrição do produto | ✅ Manter, simplificado (nome/descrição do curso) |
| Precificação e ofertas | Preço, parcelamento, ofertas | ❌ Cortar |
| Página do produto | Landing page de vendas | ❌ Cortar |
| Programa de afiliados | Comissão para afiliados venderem | ❌ Cortar |
| Coproduções | Split de receita entre produtores | ❌ Cortar |
| Cupons | Cupom de desconto | ❌ Cortar |
| Coleta de impostos | Nota fiscal/impostos da venda | ❌ Cortar |

### **Nível "Área de Membros" (onde o conteúdo e os alunos vivem) — aqui está o que importa**

| Item na Hotmart | O que é | Manter no seu sistema? |
| ----- | ----- | ----- |
| **Conteúdo → Principal** | Módulos e aulas (vídeo \+ texto \+ anexos), a estrutura hierárquica do curso | ✅ Manter — é o núcleo |
| **Conteúdo → aula individual** | Upload de vídeo, texto de apoio, arquivos anexos (até 10, até 100MB), link de leitura complementar, agendamento de liberação por turma | ✅ Manter (upload de vídeo, materiais, texto); liberação agendada é ótimo para trilhas com etapas — vale incluir |
| **Conteúdo → Quiz** | Tipo "Exercício" (múltipla escolha, nota final) ou "Perfil" (resultado personalizado por tipo de resposta) | ✅ Manter só o tipo "Exercício" — "Perfil" é para quiz de personalidade/segmentação de marketing, não serve para avaliação de treinamento |
| **Conteúdo → Anúncio** | Oferece outro produto para quem já comprou (upsell) | ❌ Cortar — é 100% venda |
| **Conteúdo → Live** | Transmissão ao vivo dentro da aula | 🟡 Opcional — só se pretende fazer treinamentos ao vivo |
| **Conteúdo → Trilhas** | Organiza o conteúdo de um curso em categorias/sequência | ✅ Manter — é exatamente o conceito de trilha que você quer |
| **Turmas** | Agrupar alunos em turmas, que controlam quais conteúdos cada grupo recebe e quando | ✅ Manter — mapeia bem para "equipe" ou "departamento" |
| **Usuários** | Lista de alunos com progresso %, engajamento (alto/médio/baixo), aula atual, último acesso, importação em massa por CSV | ✅ Manter — é o coração do que você queria da Hotmart. A importação por CSV também resolve o cadastro manual dos 70 usuários de uma vez |
| **Usuários → ficha do aluno** | Progresso detalhado, páginas concluídas/não concluídas com data, resultado de quiz, histórico de acessos (sessão iniciada, página X acessada, em que data) | ✅ Manter — é literalmente "quem começou, até onde foi, fez o quiz, quantos acertou" |
| **Comentários** | Alunos comentam em cada aula, produtor modera | 🟡 Opcional — útil para dúvidas, mas não essencial no MVP |
| **Certificado** | Editor de template com campos automáticos (nome do aluno, curso, data, organizador, turma), liga/desliga por curso | ✅ Manter — exatamente como está na Hotmart |
| **Comunidades / Moderação** | Fórum/chat da comunidade de alunos e suas ferramentas de moderação | ❌ Cortar — não é treinamento, é comunidade de infoproduto |
| **Vendas / Combos** | Gestão de vendas e pacotes de produtos | ❌ Cortar |
| **Personalização** | Nome da área, vitrine (home), página de login, domínio próprio | ✅ Manter simplificado — nome do sistema, logo/cor da empresa e talvez domínio próprio; não precisa do editor visual completo |
| **Gamificação** | Pontos, badges, rankings | 🟡 Opcional — pode ajudar engajamento, mas é "nice to have" |
| **Insights → Cursos** | Dashboard agregado: alunos inscritos, que acessaram, que iniciaram, ciclo de vida (ativos/inativos/recuperados) | ✅ Manter — é o relatório gerencial que o RH vai querer |
| **Insights → Tutor / Agentes de IA** | Tutor de IA que responde dúvidas dos alunos automaticamente | ❌ Cortar do MVP — é diferencial de produto pago, não essencial |
| **Configurações** | Nome da área de membros, URL/domínio | ✅ Manter, simplificado |

### **Resumo: o admin do seu sistema, só com o essencial**

1. **Cursos e Trilhas** — criar curso, módulo, aula (vídeo \+ texto \+ materiais), organizar aulas em trilha sequencial, agendar liberação  
2. **Quiz** — banco de questões de múltipla escolha com nota final  
3. **Usuários e Turmas** — importar em massa (CSV), agrupar por turma/equipe, atribuir trilha  
4. **Relatórios** — lista de alunos com progresso/engajamento/último acesso; ficha individual com páginas concluídas, resultado de quiz e histórico de acesso; dashboard agregado de inscritos/ativos/inativos  
5. **Certificados** — template com campos automáticos, liga/desliga por curso  
6. **Personalização básica** — nome do sistema, logo, cor da empresa

Tudo que ficou de fora (venda, afiliados, cupons, impostos, comunidade, IA de tutor, gamificação) é especificamente porque a Hotmart é uma plataforma de venda de infoproduto — não porque falta em algum "nível" de sistema mais simples.

## **Como a trilha aparece para o aluno (visão real na Hotmart, 26/08/2026)**

Usei o modo "Visualizar como: Membro com acesso" da própria Hotmart para ver a tela exatamente como um aluno vê. Estrutura da tela de curso:

**Página do curso** (antes de entrar em uma aula): banner com título e descrição do curso, barra de progresso geral ("1/25 conteúdos — 4%"), botão "Continuar assistindo" que leva direto para a próxima aula não concluída, e abaixo a lista completa de conteúdo organizada por módulo (thumbnail do vídeo \+ duração \+ título de cada aula).

**Página de uma aula** (assistindo): layout em duas colunas —

* **Coluna principal**: player de vídeo, abaixo dele um botão "Concluir" (o aluno marca manualmente, além do que o sistema já capta automaticamente pelo player) com avaliação por estrelas opcional, abas "Descrição" (texto de apoio) e "Materiais" (arquivos anexos com botão Download, ou links externos com botão Abrir), e uma seção de comentários no rodapé.  
* **Coluna lateral direita**: a trilha inteira do curso listada verticalmente — miniatura \+ duração de cada aula, título, e um ícone de check à direita (contorno cinza \= não concluída, preenchido verde \= concluída). A aula atual é destacada com "Tocando agora". Tem uma busca por conteúdo no topo da lista.  
* Navegação por setas (anterior/próxima aula) no topo da tela, sem precisar voltar para a lista.

Isso confirma visualmente a estrutura da trilha que você quer: navegação sequencial clara, indicação de progresso em cada nível (curso inteiro e por aula), e a lista de conteúdo sempre visível ao lado do vídeo — o aluno nunca perde a noção de "onde estou" e "o que falta". Vale replicar esse padrão (lista lateral com checkmarks \+ player central \+ botão continuar) porque é uma UX já validada e familiar para quem já usou Hotmart antes.

Uma observação de UX: o "Concluir" é uma ação manual do aluno nessa tela (clicar no botão), separada do tracking automático de % assistido do vídeo — no seu sistema vale decidir se a conclusão da aula é automática (ex.: ao atingir 90% do vídeo) ou também exige essa confirmação manual do aluno, o que pode ser mais confiável para efeitos de certificação corporativa.

## **Modelo de dados (entidades principais)**

`Empresa (tenant) → Usuário (admin/aluno) → Trilha → Curso → Módulo → Aula → Progresso (por usuário/aula) → Quiz → Questão → Tentativa/Resposta → Certificado`

Ter "Empresa" como entidade de topo desde já é o que mantém a porta aberta para multi-tenant no futuro, mesmo lançando com um cliente só.

## **Construir do zero vs. adaptar open-source vs. caminho híbrido**

Com o objetivo de "começar com um cliente, mas pensando em escalar", os três caminhos possíveis:

### **A. Construir do zero (stack próprio, multi-tenant desde o início)**

Sistema sob medida — ex.: Next.js \+ banco Postgres (Supabase, com Row Level Security para isolar dados por empresa/tenant), autenticação própria ou Auth0/Clerk.

* ✅ Controle total de UX/marca (branding por cliente), arquitetura multi-tenant real desde o dia 1, dado fica todo seu  
* ✅ Faz sentido com seu perfil (product design \+ trabalho direto com devs / specs)  
* ❌ Maior prazo e esforço — inclusive reconstruir o player com tracking do zero, se não usar uma API de vídeo pronta

### **B. Adaptar um LMS open-source (Moodle, Chamilo, Open edX, LearnDash/Tutor)**

* ✅ Resolve o limite de 10 usuários quase imediatamente — no ar em dias, não meses  
* ✅ Tracking de progresso, quiz, certificados e relatórios já vêm prontos  
* ❌ "Multi-tenant" nesse caminho normalmente significa uma instância separada por cliente (não uma base de dados única multi-empresa) — funciona, mas escalar para muitos clientes vira operação de infraestrutura (subir uma instância nova por cliente), não um produto SaaS único  
* ❌ Customização visual/UX mais limitada — pode não passar a impressão de "sistema próprio" para o cliente final

### **C. Caminho híbrido (recomendado — decisão atual): comprar a parte difícil, construir a parte fácil**

Usar uma API de vídeo especializada (Mux, Cloudflare Stream ou Bunny Stream) só para hospedagem \+ player \+ eventos de progresso — que é exatamente a parte que a Hotmart resolvia bem e que seria a mais cara de reconstruir do zero — e construir por cima uma camada própria, leve, já multi-tenant (estrutura de curso, quiz, dashboard de relatórios, certificados).

* ✅ Evita reinventar a parte mais complexa (streaming de vídeo \+ tracking) e ainda assim entrega um produto com marca própria e arquitetura pronta para múltiplos clientes  
* ✅ Esforço de desenvolvimento bem menor que a opção A, com controle de produto bem maior que a opção B  
* ✅ Com só 70 usuários, o custo recorrente da API de vídeo é praticamente irrelevante (na faixa de poucas dezenas de dólares/mês em qualquer uma das três opções, considerando volume de aulas típico de treinamento corporativo)

**Stack sugerida para essa escala:**

* Frontend: Next.js (React) — funciona bem para as duas áreas (admin e aluno) e facilita handoff de design → código  
* Backend/banco: Supabase (Postgres \+ Auth \+ Storage) — resolve auth simples de e-mail/senha, banco relacional para o modelo de dados acima, e já suporta isolamento por "empresa" via Row Level Security caso apareça um segundo cliente  
* Vídeo: Cloudflare Stream ou Bunny Stream (mais baratos que Mux/Vimeo em baixo volume) — hospedagem \+ player embutido \+ webhooks de progresso  
* Hospedagem da aplicação: Vercel

## **Como o upload/player fica "embutido" no seu sistema (não na Cloudflare)**

O arquivo de vídeo é armazenado e distribuído pela Cloudflare, mas a experiência de upload e reprodução acontece inteiramente dentro do seu próprio painel — ninguém (admin ou aluno) precisa acessar o dashboard da Cloudflare:

1. Na tela de criar aula (admin), o backend pede à Cloudflare uma URL de upload de uso único (API)  
2. O navegador envia o arquivo direto para essa URL (não passa pelo seu servidor — evita sobrecarregar sua infra com upload pesado); para arquivos grandes/conexão instável, usa-se o protocolo TUS, que é resumível  
3. A Cloudflare devolve um ID único do vídeo, salvo no banco associado à aula  
4. Na tela do aluno, o player embutido usa esse ID para tocar — a URL de streaming é da Cloudflare, mas visualmente é parte da sua interface, com sua marca

## **Em aberto**

* Prazo e orçamento disponíveis  
* Quem vai desenvolver: você mesmo com ferramentas de IA (Cursor/Claude Code), um time de dev contratado, ou parceria  
* Quantos cursos/trilhas e volume de vídeo inicial (só para confirmar que a estimativa de custo de vídeo acima se sustenta)

