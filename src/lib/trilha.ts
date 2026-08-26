import { createClient } from "@/lib/supabase/server";

export interface AulaComProgresso {
  id: string;
  titulo: string;
  ordem: number;
  videoId: string | null;
  concluida: boolean;
  percentual: number;
  posicaoSegundos: number;
}

export interface ModuloComAulas {
  id: string;
  nome: string;
  aulas: AulaComProgresso[];
}

export interface CursoDaTrilha {
  id: string;
  nome: string;
  ordem: number;
  bloqueiaProximo: boolean;
  concluido: boolean;
  bloqueado: boolean;
  modulos: ModuloComAulas[];
}

export interface TrilhaDoAluno {
  id: string;
  nome: string;
  cursos: CursoDaTrilha[];
}

export async function getTrilhaDoAluno(usuarioId: string): Promise<TrilhaDoAluno | null> {
  const supabase = await createClient();

  const { data: turmasDoUsuario } = await supabase
    .from("usuarios_turmas")
    .select("turma_id")
    .eq("usuario_id", usuarioId);

  const turmaIds = (turmasDoUsuario ?? []).map((t) => t.turma_id);

  const filtro = turmaIds.length > 0
    ? `usuario_id.eq.${usuarioId},turma_id.in.(${turmaIds.join(",")})`
    : `usuario_id.eq.${usuarioId}`;

  const { data: atribuicao } = await supabase
    .from("atribuicoes_trilha")
    .select("trilha_id")
    .or(filtro)
    .limit(1)
    .maybeSingle();

  if (!atribuicao) return null;

  const { data: trilha } = await supabase
    .from("trilhas")
    .select("id, nome")
    .eq("id", atribuicao.trilha_id)
    .single();

  if (!trilha) return null;

  const { data: trilhaCursos } = await supabase
    .from("trilhas_cursos")
    .select(
      "ordem, bloqueia_proximo, cursos(id, nome, modulos(id, nome, ordem, aulas(id, titulo, ordem, video_id_cloudflare)))",
    )
    .eq("trilha_id", trilha.id)
    .order("ordem");

  const aulaIds: string[] = [];
  for (const tc of trilhaCursos ?? []) {
    const curso = tc.cursos as unknown as { modulos: { aulas: { id: string }[] }[] };
    for (const modulo of curso?.modulos ?? []) {
      for (const aula of modulo.aulas ?? []) aulaIds.push(aula.id);
    }
  }

  const { data: progressos } = aulaIds.length
    ? await supabase
        .from("progresso")
        .select("aula_id, concluida, percentual_assistido, posicao_segundos")
        .eq("usuario_id", usuarioId)
        .in("aula_id", aulaIds)
    : { data: [] };

  const progressoPorAula = new Map(
    (progressos ?? []).map((p) => [p.aula_id, p]),
  );

  const cursos: CursoDaTrilha[] = (trilhaCursos ?? []).map((tc) => {
    const curso = tc.cursos as unknown as {
      id: string;
      nome: string;
      modulos: { id: string; nome: string; ordem: number; aulas: { id: string; titulo: string; ordem: number; video_id_cloudflare: string | null }[] }[];
    };

    const modulos: ModuloComAulas[] = (curso.modulos ?? [])
      .sort((a, b) => a.ordem - b.ordem)
      .map((m) => ({
        id: m.id,
        nome: m.nome,
        aulas: (m.aulas ?? [])
          .sort((a, b) => a.ordem - b.ordem)
          .map((a) => {
            const p = progressoPorAula.get(a.id);
            return {
              id: a.id,
              titulo: a.titulo,
              ordem: a.ordem,
              videoId: a.video_id_cloudflare,
              concluida: p?.concluida ?? false,
              percentual: p?.percentual_assistido ?? 0,
              posicaoSegundos: p?.posicao_segundos ?? 0,
            };
          }),
      }));

    const todasAulas = modulos.flatMap((m) => m.aulas);
    const concluido = todasAulas.length > 0 && todasAulas.every((a) => a.concluida);

    return {
      id: curso.id,
      nome: curso.nome,
      ordem: tc.ordem,
      bloqueiaProximo: tc.bloqueia_proximo,
      concluido,
      bloqueado: false, // calculado abaixo, precisa da ordem completa primeiro
      modulos,
    };
  });

  let bloqueadoAPartirDaqui = false;
  for (const curso of cursos) {
    curso.bloqueado = bloqueadoAPartirDaqui;
    if (curso.bloqueiaProximo && !curso.concluido) bloqueadoAPartirDaqui = true;
  }

  return { id: trilha.id, nome: trilha.nome, cursos };
}

export async function getAulaComContexto(usuarioId: string, aulaId: string) {
  const trilha = await getTrilhaDoAluno(usuarioId);
  if (!trilha) return null;

  for (const curso of trilha.cursos) {
    for (const modulo of curso.modulos) {
      const aula = modulo.aulas.find((a) => a.id === aulaId);
      if (aula) {
        const todasAulasDoCurso = curso.modulos.flatMap((m) => m.aulas);
        const indice = todasAulasDoCurso.findIndex((a) => a.id === aulaId);
        return {
          trilha,
          curso,
          aula,
          anterior: todasAulasDoCurso[indice - 1] ?? null,
          proxima: todasAulasDoCurso[indice + 1] ?? null,
        };
      }
    }
  }

  return null;
}
