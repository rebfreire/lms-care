import { createClient } from "@/lib/supabase/server";

export interface CursoRelatorio {
  id: string;
  nome: string;
  totalAlunos: number;
  naoIniciaram: number;
  emAndamento: number;
  concluidos: number;
}

export interface AlunoCursoRelatorio {
  id: string;
  nome: string;
  email: string;
  turma: string | null;
  status: "não iniciado" | "em andamento" | "concluído";
  percentual: number;
  concluidoEm: string | null;
}

export interface AlunoRelatorio {
  id: string;
  nome: string;
  email: string;
  turma: string | null;
  trilhaNome: string | null;
  totalAulas: number;
  aulasConcluidas: number;
  percentual: number;
  ultimoAcesso: string | null;
  engajamento: "não iniciado" | "ativo" | "inativo";
}

const DIAS_PARA_INATIVO = 14;

export async function getRelatorioAlunos(): Promise<AlunoRelatorio[]> {
  const supabase = await createClient();

  const [{ data: usuarios }, { data: usuariosTurmas }, { data: atribuicoes }, { data: trilhasCursos }] =
    await Promise.all([
      supabase.from("usuarios").select("id, nome, email").eq("papel", "aluno"),
      supabase.from("usuarios_turmas").select("usuario_id, turma_id, turmas(nome)"),
      supabase.from("atribuicoes_trilha").select("trilha_id, usuario_id, turma_id, trilhas(nome)"),
      supabase
        .from("trilhas_cursos")
        .select("trilha_id, cursos(modulos(aulas(id)))"),
    ]);

  const turmaPorUsuario = new Map<string, { turmaId: string; turmaNome: string }>();
  for (const ut of usuariosTurmas ?? []) {
    turmaPorUsuario.set(ut.usuario_id, {
      turmaId: ut.turma_id,
      turmaNome: (ut.turmas as unknown as { nome: string })?.nome ?? "",
    });
  }

  const trilhaPorUsuarioDireto = new Map<string, { id: string; nome: string }>();
  const trilhaPorTurma = new Map<string, { id: string; nome: string }>();
  for (const a of atribuicoes ?? []) {
    const trilhaInfo = { id: a.trilha_id, nome: (a.trilhas as unknown as { nome: string })?.nome ?? "" };
    if (a.usuario_id) trilhaPorUsuarioDireto.set(a.usuario_id, trilhaInfo);
    if (a.turma_id) trilhaPorTurma.set(a.turma_id, trilhaInfo);
  }

  const aulasPorTrilha = new Map<string, string[]>();
  for (const tc of trilhasCursos ?? []) {
    const curso = tc.cursos as unknown as { modulos: { aulas: { id: string }[] }[] };
    const ids = (curso?.modulos ?? []).flatMap((m) => m.aulas.map((a) => a.id));
    aulasPorTrilha.set(tc.trilha_id, [...(aulasPorTrilha.get(tc.trilha_id) ?? []), ...ids]);
  }

  const todasAulaIds = [...new Set([...aulasPorTrilha.values()].flat())];

  const { data: progressos } = todasAulaIds.length
    ? await supabase
        .from("progresso")
        .select("usuario_id, aula_id, concluida, ultimo_acesso_em")
        .in("aula_id", todasAulaIds)
    : { data: [] };

  const progressoPorUsuario = new Map<
    string,
    { aula_id: string; concluida: boolean; ultimo_acesso_em: string }[]
  >();
  for (const p of progressos ?? []) {
    progressoPorUsuario.set(p.usuario_id, [...(progressoPorUsuario.get(p.usuario_id) ?? []), p]);
  }

  const agora = Date.now();

  return (usuarios ?? []).map((u) => {
    const turma = turmaPorUsuario.get(u.id);
    const trilha = trilhaPorUsuarioDireto.get(u.id) ?? (turma ? trilhaPorTurma.get(turma.turmaId) : undefined);
    const aulaIdsDaTrilha = trilha ? aulasPorTrilha.get(trilha.id) ?? [] : [];
    const totalAulas = aulaIdsDaTrilha.length;

    const meusProgressos = (progressoPorUsuario.get(u.id) ?? []).filter((p) =>
      aulaIdsDaTrilha.includes(p.aula_id),
    );
    const aulasConcluidas = meusProgressos.filter((p) => p.concluida).length;
    const percentual = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;

    const ultimoAcesso = meusProgressos
      .map((p) => p.ultimo_acesso_em)
      .sort()
      .at(-1) ?? null;

    let engajamento: AlunoRelatorio["engajamento"] = "não iniciado";
    if (ultimoAcesso) {
      const diasDesde = (agora - new Date(ultimoAcesso).getTime()) / (1000 * 60 * 60 * 24);
      engajamento = diasDesde <= DIAS_PARA_INATIVO ? "ativo" : "inativo";
    }

    return {
      id: u.id,
      nome: u.nome,
      email: u.email,
      turma: turma?.turmaNome ?? null,
      trilhaNome: trilha?.nome ?? null,
      totalAulas,
      aulasConcluidas,
      percentual,
      ultimoAcesso,
      engajamento,
    };
  });
}

export async function getRelatorioCursos(): Promise<CursoRelatorio[]> {
  const supabase = await createClient();

  const [{ data: trilhasCursos }, { data: atribuicoes }, { data: usuariosTurmas }] = await Promise.all([
    supabase
      .from("trilhas_cursos")
      .select("trilha_id, cursos(id, nome, modulos(aulas(id)))"),
    supabase.from("atribuicoes_trilha").select("trilha_id, usuario_id, turma_id"),
    supabase.from("usuarios_turmas").select("usuario_id, turma_id"),
  ]);

  const turmasPorUsuario = new Map<string, string[]>();
  for (const ut of usuariosTurmas ?? []) {
    turmasPorUsuario.set(ut.usuario_id, [...(turmasPorUsuario.get(ut.usuario_id) ?? []), ut.turma_id]);
  }

  // Todos os alunos, com o conjunto de trilhas a que têm acesso (direto ou via turma).
  const { data: alunos } = await supabase.from("usuarios").select("id").eq("papel", "aluno");
  const trilhasPorAluno = new Map<string, Set<string>>();
  for (const aluno of alunos ?? []) {
    const turmasDoAluno = turmasPorUsuario.get(aluno.id) ?? [];
    const trilhas = (atribuicoes ?? [])
      .filter((a) => a.usuario_id === aluno.id || (a.turma_id && turmasDoAluno.includes(a.turma_id)))
      .map((a) => a.trilha_id);
    trilhasPorAluno.set(aluno.id, new Set(trilhas));
  }

  const cursos = (trilhasCursos ?? []).map((tc) => {
    const curso = tc.cursos as unknown as { id: string; nome: string; modulos: { aulas: { id: string }[] }[] };
    const aulaIds = (curso?.modulos ?? []).flatMap((m) => m.aulas.map((a) => a.id));
    return { trilhaId: tc.trilha_id, id: curso.id, nome: curso.nome, aulaIds };
  });

  const todasAulaIds = [...new Set(cursos.flatMap((c) => c.aulaIds))];
  const { data: progressos } = todasAulaIds.length
    ? await supabase
        .from("progresso")
        .select("usuario_id, aula_id, concluida")
        .in("aula_id", todasAulaIds)
    : { data: [] };

  const progressoPorUsuario = new Map<string, { aula_id: string; concluida: boolean }[]>();
  for (const p of progressos ?? []) {
    progressoPorUsuario.set(p.usuario_id, [...(progressoPorUsuario.get(p.usuario_id) ?? []), p]);
  }

  return cursos
    .filter((c) => c.aulaIds.length > 0)
    .map((curso) => {
      const alunosElegiveis = (alunos ?? []).filter((a) => trilhasPorAluno.get(a.id)?.has(curso.trilhaId));

      let naoIniciaram = 0;
      let emAndamento = 0;
      let concluidos = 0;

      for (const aluno of alunosElegiveis) {
        const progressosDoAluno = (progressoPorUsuario.get(aluno.id) ?? []).filter((p) =>
          curso.aulaIds.includes(p.aula_id),
        );
        const concluidas = progressosDoAluno.filter((p) => p.concluida).length;

        if (progressosDoAluno.length === 0) naoIniciaram++;
        else if (concluidas === curso.aulaIds.length) concluidos++;
        else emAndamento++;
      }

      return {
        id: curso.id,
        nome: curso.nome,
        totalAlunos: alunosElegiveis.length,
        naoIniciaram,
        emAndamento,
        concluidos,
      };
    });
}

export async function getNomeCurso(cursoId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("cursos").select("nome").eq("id", cursoId).single();
  return data?.nome ?? null;
}

export async function getRelatorioCursoDetalhado(cursoId: string): Promise<AlunoCursoRelatorio[]> {
  const supabase = await createClient();

  const [{ data: trilhasCursos }, { data: atribuicoes }, { data: usuariosTurmas }, { data: alunos }] =
    await Promise.all([
      supabase.from("trilhas_cursos").select("trilha_id, cursos(id, modulos(aulas(id)))").eq("curso_id", cursoId),
      supabase.from("atribuicoes_trilha").select("trilha_id, usuario_id, turma_id"),
      supabase.from("usuarios_turmas").select("usuario_id, turma_id, turmas(nome)"),
      supabase.from("usuarios").select("id, nome, email").eq("papel", "aluno"),
    ]);

  const trilhaIds = (trilhasCursos ?? []).map((tc) => tc.trilha_id);
  const aulaIds = (trilhasCursos ?? []).flatMap((tc) => {
    const curso = tc.cursos as unknown as { modulos: { aulas: { id: string }[] }[] };
    return (curso?.modulos ?? []).flatMap((m) => m.aulas.map((a) => a.id));
  });

  const turmaPorUsuario = new Map<string, { turmaId: string; turmaNome: string }>();
  for (const ut of usuariosTurmas ?? []) {
    turmaPorUsuario.set(ut.usuario_id, {
      turmaId: ut.turma_id,
      turmaNome: (ut.turmas as unknown as { nome: string })?.nome ?? "",
    });
  }

  const alunosElegiveis = (alunos ?? []).filter((a) => {
    const turma = turmaPorUsuario.get(a.id);
    return (atribuicoes ?? []).some(
      (at) =>
        trilhaIds.includes(at.trilha_id) &&
        (at.usuario_id === a.id || (turma && at.turma_id === turma.turmaId)),
    );
  });

  const { data: progressos } = aulaIds.length
    ? await supabase
        .from("progresso")
        .select("usuario_id, aula_id, concluida, concluida_em")
        .in("aula_id", aulaIds)
    : { data: [] };

  const progressoPorUsuario = new Map<
    string,
    { aula_id: string; concluida: boolean; concluida_em: string | null }[]
  >();
  for (const p of progressos ?? []) {
    progressoPorUsuario.set(p.usuario_id, [...(progressoPorUsuario.get(p.usuario_id) ?? []), p]);
  }

  return alunosElegiveis.map((aluno) => {
    const progressosDoAluno = (progressoPorUsuario.get(aluno.id) ?? []).filter((p) =>
      aulaIds.includes(p.aula_id),
    );
    const concluidas = progressosDoAluno.filter((p) => p.concluida);
    const percentual = aulaIds.length > 0 ? Math.round((concluidas.length / aulaIds.length) * 100) : 0;

    let status: AlunoCursoRelatorio["status"] = "não iniciado";
    let concluidoEm: string | null = null;

    if (concluidas.length > 0 && aulaIds.length > 0 && concluidas.length === aulaIds.length) {
      status = "concluído";
      concluidoEm = concluidas
        .map((p) => p.concluida_em)
        .filter((d): d is string => !!d)
        .sort()
        .at(-1) ?? null;
    } else if (progressosDoAluno.length > 0) {
      status = "em andamento";
    }

    return {
      id: aluno.id,
      nome: aluno.nome,
      email: aluno.email,
      turma: turmaPorUsuario.get(aluno.id)?.turmaNome ?? null,
      status,
      percentual,
      concluidoEm,
    };
  });
}
