"use server";

import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/supabase/auth";
import { verificarEGerarCertificadoDoCurso, getCursoIdDaAula } from "@/lib/certificado";

export interface ResultadoQuiz {
  nota: number;
  aprovado: boolean;
  corretas: Record<string, string>; // questao_id -> alternativa_id correta
}

export async function responderQuiz(
  quizId: string,
  _prevState: ResultadoQuiz | string | null,
  formData: FormData,
): Promise<ResultadoQuiz | string> {
  const usuario = await getUsuarioAtual();
  if (!usuario) return "Sessão expirada, faça login de novo.";

  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("aula_id, nota_corte, tentativas_permitidas")
    .eq("id", quizId)
    .single();
  if (!quiz) return "Quiz não encontrado.";

  const { count: tentativasFeitas } = await supabase
    .from("tentativas_quiz")
    .select("id", { count: "exact", head: true })
    .eq("quiz_id", quizId)
    .eq("usuario_id", usuario.id);

  if ((tentativasFeitas ?? 0) >= quiz.tentativas_permitidas) {
    return "Você já usou todas as tentativas permitidas.";
  }

  const { data: questoes } = await supabase
    .from("questoes")
    .select("id, alternativas(id, correta)")
    .eq("quiz_id", quizId);

  if (!questoes || questoes.length === 0) return "Quiz sem questões.";

  let acertos = 0;
  const corretas: Record<string, string> = {};
  const respostasParaSalvar: { questao_id: string; alternativa_id: string }[] = [];

  for (const questao of questoes) {
    const alternativas = questao.alternativas as { id: string; correta: boolean }[];
    const corretaAlt = alternativas.find((a) => a.correta);
    if (corretaAlt) corretas[questao.id] = corretaAlt.id;

    const respostaId = String(formData.get(`questao_${questao.id}`) ?? "");
    if (!respostaId) continue;

    respostasParaSalvar.push({ questao_id: questao.id, alternativa_id: respostaId });
    if (corretaAlt && respostaId === corretaAlt.id) acertos++;
  }

  const nota = Math.round((acertos / questoes.length) * 100);
  const aprovado = nota >= quiz.nota_corte;

  const { data: tentativa, error } = await supabase
    .from("tentativas_quiz")
    .insert({ usuario_id: usuario.id, quiz_id: quizId, nota, aprovado })
    .select("id")
    .single();

  if (error || !tentativa) return "Erro ao salvar a tentativa.";

  if (respostasParaSalvar.length > 0) {
    await supabase.from("respostas").insert(
      respostasParaSalvar.map((r) => ({ ...r, tentativa_id: tentativa.id })),
    );
  }

  if (aprovado) {
    try {
      const cursoId = await getCursoIdDaAula(quiz.aula_id);
      if (cursoId) await verificarEGerarCertificadoDoCurso(usuario.id, cursoId);
    } catch (erro) {
      // A tentativa já foi salva acima — o aluno precisa ver o resultado
      // mesmo que a geração do certificado falhe.
      console.error("Falha ao gerar certificado:", erro);
    }
  }

  return { nota, aprovado, corretas };
}
