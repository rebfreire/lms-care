import { createClient } from "@/lib/supabase/server";

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
