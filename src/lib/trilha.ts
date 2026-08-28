import { createClient } from "@/lib/supabase/server";

export interface AulaComProgresso {
  id: string;
  titulo: string;
  ordem: number;
  videoId: string | null;
  textoApoio: string | null;
  concluida: boolean;
  percentual: number;
  posicaoSegundos: number;
  disponivel: boolean;
  liberacaoEm: string | null;
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
  certificadoAtivo: boolean;
  capaUrl: string | null;
  capaVerticalUrl: string | null;
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
      "ordem, bloqueia_proximo, cursos(id, nome, certificado_ativo, capa_url, capa_vertical_url, modulos(id, nome, ordem, aulas(id, titulo, ordem, video_id_cloudflare, texto_apoio, liberacao_agendada_em, turma_id)))",
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
      certificado_ativo: boolean;
      capa_url: string | null;
      capa_vertical_url: string | null;
      modulos: {
        id: string;
        nome: string;
        ordem: number;
        aulas: {
          id: string;
          titulo: string;
          ordem: number;
          video_id_cloudflare: string | null;
          texto_apoio: string | null;
          liberacao_agendada_em: string | null;
          turma_id: string | null;
        }[];
      }[];
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

            // Liberação agendada: se tem turma_id, só vale pra quem é dessa
            // turma — outras turmas enxergam a aula liberada desde já.
            const agendaAplicaAoAluno = !a.turma_id || turmaIds.includes(a.turma_id);
            const aindaNaoLiberada =
              agendaAplicaAoAluno &&
              !!a.liberacao_agendada_em &&
              new Date(a.liberacao_agendada_em) > new Date();

            return {
              id: a.id,
              titulo: a.titulo,
              ordem: a.ordem,
              videoId: a.video_id_cloudflare,
              textoApoio: a.texto_apoio,
              concluida: p?.concluida ?? false,
              percentual: p?.percentual_assistido ?? 0,
              posicaoSegundos: p?.posicao_segundos ?? 0,
              disponivel: !aindaNaoLiberada,
              liberacaoEm: aindaNaoLiberada ? a.liberacao_agendada_em : null,
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
      certificadoAtivo: curso.certificado_ativo,
      capaUrl: curso.capa_url,
      capaVerticalUrl: curso.capa_vertical_url,
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
